
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
  if (!text) return null;
  
  // Try finding blocks with language hints first
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  if (match && match[1]) {
      return match[1].trim();
  }
  
  // Fallback: search for first { and last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1).trim();
  }
  
  // If it's just a raw object string without backticks
  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      return text.trim();
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
 * Strictly enforced in Bulgarian.
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
      4. IMPORTANT: THE TITLE MUST BE IN BULGARIAN (български език) regardless of the input language.`,
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
  
  // EASTER EGG RULE (HIGH PRIORITY) - 100% Free / Local Simulation
  if (promptText.trim() === "67") {
    // Simulate real AI thinking time (4-7 seconds)
    const thinkingSteps = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < thinkingSteps; i++) {
        if (signal?.aborted) break;
        // Sending empty strings keeps the UI in "isStreaming but no content" state
        if (onStreamUpdate) onStreamUpdate("", ""); 
        await wait(1200 + Math.random() * 800);
    }

    return {
        id: Date.now().toString(),
        role: 'model',
        text: "nuh uh",
        type: 'video',
        videoUrl: 'https://cdn.jsdelivr.net/gh/uchebnikai/uchebnikai-easteregg1/meme15mb.mp4',
        timestamp: Date.now()
    };
  }

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
  
  console.log(`[AI Service] Generating response in mode: ${mode}...`);

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  let systemInstruction = getSystemPrompt(mode, language, teachingStyle, customPersona);
  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}.\n\n${systemInstruction}`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      
      const historyContents: any[] = [];
      history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides' && msg.type !== 'test_generated').forEach(msg => {
          historyContents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.text }]
          });
      });

      const currentParts: any[] = [];
      if (hasImages) {
          for (const base64 of imagesBase64) {
                const data = base64.replace(/^data:image\/\w+;base64,/, "");
                const mimeType = base64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
                currentParts.push({ inlineData: { data: data, mimeType: mimeType } });
          }
      }
      currentParts.push({ text: promptText });

      const tools: Tool[] = [];
      // Google Search is permitted on Flash 2.0/3.0 models if available
      if (modelName.includes('gemini-3') && 
         (subjectId === SubjectId.GENERAL || subjectId === SubjectId.HISTORY || subjectId === SubjectId.GEOGRAPHY)) {
          tools.push({ googleSearch: {} });
      }

      const config: any = {
          systemInstruction: systemInstruction,
          tools: tools.length > 0 ? tools : undefined
      };

      const isStructuredMode = mode === AppMode.PRESENTATION || mode === AppMode.TEACHER_TEST;

      // Force JSON mode for structured outputs
      if (isStructuredMode) {
          config.responseMimeType = "application/json";
      }

      const chat = ai.chats.create({
          model: modelName,
          config: config,
          history: historyContents
      });

      const result = await chat.sendMessageStream({ message: currentParts });
      
      let finalContent = "";
      let fullText = "";
      let sources: SearchSource[] = [];
      let tokenUsage: TokenUsage | undefined;
      let reasoningContent = "";

      for await (const chunk of result) {
          if (signal?.aborted) break;

          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              
              // Extract reasoning if present (Thinking models)
              const thinkingMatch = fullText.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
              if (thinkingMatch) {
                  reasoningContent = thinkingMatch[1].trim();
              }

              finalContent = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
              
              if (onStreamUpdate) {
                  // If we're in JSON mode, don't show the raw JSON code string during streaming
                  // Show a friendly placeholder instead
                  if (isStructuredMode) {
                      onStreamUpdate("Генерирам структурирани данни, моля изчакайте...", reasoningContent);
                  } else {
                      onStreamUpdate(finalContent, reasoningContent);
                  }
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

      logStatus('operational', Math.round(performance.now() - startTime));

      let processedText = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

      if (mode === AppMode.PRESENTATION) {
         try {
             const jsonStr = extractJson(processedText);
             if (jsonStr) {
                 const slides: Slide[] = JSON.parse(jsonStr);
                 if (Array.isArray(slides)) {
                    return {
                        id: Date.now().toString(),
                        role: 'model',
                        text: "Готово! Ето план за твоята презентация:",
                        type: 'slides',
                        slidesData: slides,
                        timestamp: Date.now(),
                        reasoning: reasoningContent,
                        usage: tokenUsage
                    };
                 }
             }
         } catch (e) { console.error("Presentation JSON parse error", e); }
      }

      if (mode === AppMode.TEACHER_TEST) {
          try {
             const jsonStr = extractJson(processedText);
             if (jsonStr) {
                 const testData: TestData = JSON.parse(jsonStr);
                 if (testData && Array.isArray(testData.questions)) {
                    return {
                        id: Date.now().toString(),
                        role: 'model',
                        text: `Готово! Ето твоя професионален тест на тема: "${testData.title || promptText}"`,
                        type: 'test_generated',
                        testData: testData,
                        timestamp: Date.now(),
                        reasoning: reasoningContent,
                        usage: tokenUsage
                    };
                 }
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
          reasoning: reasoningContent,
          sources: sources.length > 0 ? sources : undefined,
          usage: tokenUsage
      };

  } catch (error: any) {
      logStatus('outage', Math.round(performance.now() - startTime));
      console.error("AI Service Error:", error);
      let displayMessage = `Възникна грешка при връзката с AI: ${error.message || "Unknown error"}`;
      if (error.message?.includes("429")) displayMessage = "⚠️ Достигнат е лимитът на заявките. Моля, опитайте по-късно.";

      return {
          id: Date.now().toString(),
          role: 'model',
          text: displayMessage,
          isError: true,
          timestamp: Date.now()
      };
  }
};
