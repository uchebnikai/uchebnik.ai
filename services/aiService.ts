
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData, TeachingStyle, SearchSource, TokenUsage } from "../types";
import { getSystemPrompt, SUBJECTS } from "../constants";
import { Language } from '../utils/translations';

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
          text: "Грешка: Не е намерен Google API ключ.",
          isError: true,
          timestamp: Date.now()
      };
  }

  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";
  
  // Enforce allowed models strictly. Defaults to 2.5-flash if invalid.
  const allowedModels = ['gemini-2.5-flash', 'gemini-3-flash'];
  const modelName = allowedModels.includes(preferredModel) ? preferredModel : 'gemini-2.5-flash';
  
  console.log(`[AI Service] Generating response using model: ${modelName} (v1) for subject: ${subjectName}`);

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  let systemInstructionText = getSystemPrompt(isImageRequest ? 'DRAW' : mode, language, teachingStyle, customPersona);
  systemInstructionText = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstructionText}`;

  try {
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
                    inline_data: {
                        data: data,
                        mime_type: mimeType
                    }
                });
          }
      }
      currentParts.push({ text: finalUserPrompt });

      const contents = [...historyContents, { role: "user", parts: currentParts }];

      const tools: any[] = [];
      if (modelName === 'gemini-3-flash' && 
         (subjectId === SubjectId.GENERAL || subjectId === SubjectId.HISTORY || subjectId === SubjectId.GEOGRAPHY)) {
          tools.push({ google_search: {} });
      }

      // Explicit v1 URL construction
      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

      const requestBody = {
          contents: contents,
          system_instruction: { parts: [{ text: systemInstructionText }] },
          tools: tools.length > 0 ? tools : undefined
      };

      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: signal
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || response.statusText);
      }

      const data = await response.json();
      
      const candidate = data.candidates?.[0];
      const processedText = candidate?.content?.parts?.map((p: any) => p.text).join('') || "";
      
      // Extract Token Usage
      let tokenUsage: TokenUsage | undefined;
      if (data.usageMetadata) {
          tokenUsage = {
              inputTokens: data.usageMetadata.promptTokenCount || 0,
              outputTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0
          };
      }

      // Extract Grounding (Search Sources)
      let sources: SearchSource[] = [];
      const grounding = candidate?.groundingMetadata;
      if (grounding && grounding.groundingChunks) {
          const webChunks = grounding.groundingChunks
              .filter((c: any) => c.web)
              .map((c: any) => ({
                  title: c.web.title || "Web Source",
                  uri: c.web.uri
              }));
          // Deduplicate
          const uniqueMap = new Map();
          webChunks.forEach((s: SearchSource) => uniqueMap.set(s.uri, s));
          sources = Array.from(uniqueMap.values());
      }

      logStatus('operational', Math.round(performance.now() - startTime));

      let cleanText = processedText;

      if (mode === AppMode.PRESENTATION) {
         try {
             const jsonStr = extractJson(cleanText);
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
             const jsonStr = extractJson(cleanText);
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

      const chartMatch = cleanText.match(/```json:chart\n([\s\S]*?)\n```/);
      if (chartMatch) {
        try {
          chartData = JSON.parse(chartMatch[1]);
          cleanText = cleanText.replace(chartMatch[0], "").trim();
        } catch (e) {}
      }

      const geoMatch = cleanText.match(/```json:geometry\n([\s\S]*?)\n```/);
      if (geoMatch) {
        try {
          geometryData = JSON.parse(geoMatch[1]);
          cleanText = cleanText.replace(geoMatch[0], "").trim();
        } catch (e) {}
      }

      return {
          id: Date.now().toString(),
          role: 'model',
          text: cleanText,
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
      console.error("Gemini API Error (REST):", error);
      let errorMessage = error.message || "Unknown error";
      let displayMessage = `Възникна грешка при връзката с AI: ${errorMessage}`;

      if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
          displayMessage = "⚠️ Достигнат е лимитът на заявките към Google Gemini. Моля, опитайте по-късно.";
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
