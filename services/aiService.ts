import { GoogleGenAI, GenerateContentResponse, Tool } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData, TeachingStyle, SearchSource, TokenUsage } from "../types";
import { getSystemPrompt, SUBJECTS } from "../constants";
import { Language } from '../utils/translations';

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to log system status
const logStatus = (status: 'operational' | 'degraded' | 'outage', latency: number) => {
    try {
        localStorage.setItem('sys_monitor_ai', JSON.stringify({
            status,
            latency,
            timestamp: Date.now()
        }));
    } catch (e) {
        // Ignore storage errors
    }
};

// Improved JSON Extractor
function extractJson(text: string): string | null {
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  if (match && match[1]) {
      return match[1];
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
  }
  return null;
}

// STRICT MODEL WHITELIST to prevent billing leaks
const ALLOWED_MODELS = [
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
];

/**
 * Generates a concise title (2-6 words) based on user's first message.
 */
export const generateChatTitle = async (userInput: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY || "";
  if (!apiKey || !userInput.trim()) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a concise, meaningful title (2-6 words) for a chat that starts with this message: "${userInput}". 
      Rules:
      1. Extract the main topic or goal.
      2. No generic words like "Chat", "Question", "Help".
      3. Reply ONLY with the title.
      4. If the message is in Bulgarian, provide the title in Bulgarian.`,
    });

    return response.text?.trim().replace(/["']/g, "") || null;
  } catch (e) {
    console.error("Title generation failed", e);
    return null;
  }
};

export const generateResponse = async (
  subjectId: SubjectId,
  mode: AppMode,
  promptText: string,
  imagesBase64?: string[],
  history: Message[] = [],
  preferredModel: string = 'gemini-2.5-flash',
  onStreamUpdate?: (text: string, reasoning: string) => void,
  signal?: AbortSignal,
  language: Language = 'bg',
  teachingStyle: TeachingStyle = 'normal',
  customPersona?: string
): Promise<Message> => {
  
  const startTime = performance.now();
  const apiKey = process.env.API_KEY || "";

  if (!apiKey) {
      logStatus('outage', 0);
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен Google API ключ. Моля, проверете настройките на Vercel (GOOGLE_API_KEY).",
          isError: true,
          timestamp: Date.now()
      };
  }

  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";
  
  // BILLING SAFETY CHECK
  let modelName = preferredModel || 'gemini-2.5-flash';
  if (!ALLOWED_MODELS.includes(modelName)) {
      console.warn(`[Billing Safety] Model request rejected. Enforcing standard tier.`);
      modelName = 'gemini-2.5-flash';
  }
  
  console.log(`[AI Service] Generating response...`);

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  
  let systemInstruction = getSystemPrompt(mode, language, teachingStyle, customPersona);

  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      
      const historyContents: any[] = [];
      history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides').forEach(msg => {
          let content = msg.text;
          if (msg.imageAnalysis) {
              content += `\n\n[CONTEXT FROM PREVIOUS IMAGE: ${msg.imageAnalysis}]`;
          }
          historyContents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: content }]
          });
      });

      const currentParts: any[] = [];
      let finalUserPrompt = promptText;
      
      if (mode === AppMode.TEACHER_TEST) {
          const prevTest = history.find(m => m.type === 'test_generated')?.testData;
          if (prevTest) {
              finalUserPrompt = `[PREVIOUS TEST CONTEXT]: ${JSON.stringify(prevTest)}\n\nUSER REQUEST: ${finalUserPrompt}`;
          }
      }

      if (hasImages) {
          for (const base64 of imagesBase64) {
                const data = base64.replace(/^data:image\/\w+;base64,/, "");
                const mimeType = base64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
                currentParts.push({
                    inlineData: {
                        data: data,
                        mimeType: mimeType
                    }
                });
          }
      }
      currentParts.push({ text: finalUserPrompt });

      const tools: Tool[] = [];
      // Google Search is permitted on Flash 2.0/3.0 models if available
      if (modelName.includes('gemini-3') && 
         (subjectId === SubjectId.GENERAL || subjectId === SubjectId.HISTORY || subjectId === SubjectId.GEOGRAPHY)) {
          tools.push({ googleSearch: {} });
      }

      const chat = ai.chats.create({
          model: modelName,
          config: {
              systemInstruction: systemInstruction,
              tools: tools.length > 0 ? tools : undefined
          },
          history: historyContents
      });

      const result = await chat.sendMessageStream({ message: currentParts });
      
      let finalContent = "";
      let fullText = "";
      let sources: SearchSource[] = [];
      let tokenUsage: TokenUsage | undefined;

      for await (const chunk of result) {
          if (signal?.aborted) {
              break;
          }

          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              finalContent = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
              if (onStreamUpdate) {
                  onStreamUpdate(finalContent, "");
              }
          }

          const grounding = chunk.candidates?.[0]?.groundingMetadata || (chunk as any).groundingMetadata;
          if (grounding && grounding.groundingChunks) {
              const webChunks = grounding.groundingChunks
                  .filter((c: any) => c.web)
                  .map((c: any) => ({
                      title: c.web.title || "Web Source",
                      uri: c.web.uri
                  }));
              webChunks.forEach((s: SearchSource) => {
                  if (!sources.some(existing => existing.uri === s.uri)) {
                      sources.push(s);
                  }
              });
          }
          
          if (chunk.usageMetadata) {
              tokenUsage = {
                  inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                  outputTokens: chunk.usageMetadata.candidatesTokenCount || 0,
                  totalTokens: chunk.usageMetadata.totalTokenCount || 0
              };
          }
      }

      // Log success latency
      logStatus('operational', Math.round(performance.now() - startTime));

      let processedText = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

      if (mode === AppMode.PRESENTATION) {
         try {
             const jsonStr = extractJson(processedText);
             if (jsonStr) {
                 const slides: Slide[] = JSON.parse(jsonStr);
                 return {
                     id: Date.now().toString(),
                     role: 'model',
                     text: "Готово! Ето план за твоята презентация:",
                     type: 'slides',
                     slidesData: slides,
                     timestamp: Date.now(),
                     reasoning: "",
                     usage: tokenUsage
                 };
             }
         } catch (e) { console.error("Presentation JSON parse error", e); }
      }

      if (mode === AppMode.TEACHER_TEST) {
          try {
             const jsonStr = extractJson(processedText);
             if (jsonStr) {
                 const testData: TestData = JSON.parse(jsonStr);
                 return {
                     id: Date.now().toString(),
                     role: 'model',
                     text: `Готово! Ето теста на тема: ${testData.title || promptText}`,
                     type: 'test_generated',
                     testData: testData,
                     timestamp: Date.now(),
                     reasoning: "",
                     usage: tokenUsage
                 };
             }
          } catch (e) { console.error("Test JSON parse error", e); }
      }

      let chartData: ChartData | undefined;
      let geometryData: GeometryData | undefined;

      const chartMatch = processedText.match(/```json:chart\n([\s\S]*?)\n```/);
      if (chartMatch) {
        try {
          chartData = JSON.parse(chartMatch[1]);
          processedText = processedText.replace(chartMatch[0], "").trim();
        } catch (e) {}
      }

      const geoMatch = processedText.match(/```json:geometry\n([\s\S]*?)\n```/);
      if (geoMatch) {
        try {
          geometryData = JSON.parse(geoMatch[1]);
          processedText = processedText.replace(geoMatch[0], "").trim();
        } catch (e) {}
      }

      return {
          id: Date.now().toString(),
          role: 'model',
          text: processedText,
          type: 'text',
          chartData: chartData,
          geometryData: geometryData,
          timestamp: Date.now(),
          reasoning: "",
          sources: sources.length > 0 ? sources : undefined,
          usage: tokenUsage
      };

  } catch (error: any) {
      logStatus('outage', Math.round(performance.now() - startTime));
      console.error("AI Service Error:", error);
      let errorMessage = error.message || "Unknown error";
      let displayMessage = `Възникна грешка при връзката с AI: ${errorMessage}`;

      if (errorMessage.includes("429")) {
          displayMessage = "⚠️ Достигнат е лимитът на заявките. Моля, опитайте по-късно.";
      }

      return {
          id: Date.now().toString(),
          role: 'model',
          text: displayMessage,
          isError: true,
          timestamp: Date.now()
      };
  }
};