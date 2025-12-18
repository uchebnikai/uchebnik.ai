
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData } from "../types";
import { getSystemPrompt, SUBJECTS } from "../constants";
import { Language } from '../utils/translations';

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  language: Language = 'bg'
): Promise<Message> => {
  
  const apiKey = process.env.API_KEY || "";

  if (!apiKey) {
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен Google API ключ. Моля, проверете настройките на Vercel (GOOGLE_API_KEY).",
          isError: true,
          timestamp: Date.now()
      };
  }

  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  // We use the internal name for system context, prompts handle the language output
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";
  const modelName = 'gemini-2.5-flash';

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  // Get localized system prompt based on mode and language
  let systemInstruction = getSystemPrompt(isImageRequest ? 'DRAW' : mode, language);
  let forceJson = false;

  if (isImageRequest) {
      // Draw instructions are handled inside getSystemPrompt if we added a DRAW case, 
      // but if not, we append specific SV instructions here if they weren't fully covered
      // Actually getSystemPrompt has default SVG instructions for SOLVE, let's ensure DRAW specific logic overrides if needed
      // For now, we rely on the helper function logic.
  } else if (mode === AppMode.TEACHER_TEST || mode === AppMode.PRESENTATION) {
      forceJson = true;
  }

  // Thinking config is implicitly supported by 2.5 Flash, instruct it to use <think> tags for UI
  systemInstruction += "\n\nIMPORTANT: Before answering, explain your reasoning step-by-step enclosed in <think> tags.";

  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Construct history contents (text only to save tokens/bandwidth)
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

      // Construct current message parts
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

      // Create chat session
      const chat = ai.chats.create({
          model: modelName,
          config: {
              systemInstruction: systemInstruction,
          },
          history: historyContents
      });

      // Stream response
      const result = await chat.sendMessageStream({ message: currentParts });
      
      let finalContent = "";
      let finalReasoning = "";
      let fullText = "";

      for await (const chunk of result) {
          // Check for abort signal
          if (signal?.aborted) {
              break;
          }

          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              
              // Simple parsing for <think> tags during stream
              const thinkMatch = fullText.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
              if (thinkMatch) {
                  finalReasoning = thinkMatch[1].trim();
                  finalContent = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
              } else {
                  finalContent = fullText;
              }

              if (onStreamUpdate) {
                  onStreamUpdate(finalContent, finalReasoning);
              }
          }
      }

      // Final cleanup
      let processedText = fullText;
      const thinkMatch = processedText.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
      if (thinkMatch) {
          if (!finalReasoning) {
             finalReasoning = thinkMatch[1].trim();
          }
          processedText = processedText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
          processedText = processedText.replace(/<think>/g, "").replace(/<\/think>/g, "");
      }

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
                     reasoning: finalReasoning
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
                     reasoning: finalReasoning
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
          reasoning: finalReasoning
      };

  } catch (error: any) {
      console.error("Gemini API Error:", error);
      let errorMessage = error.message || "Unknown error";
      let displayMessage = `Възникна грешка при връзката с AI: ${errorMessage}`;

      if (errorMessage.includes("429")) {
          displayMessage = "⚠️ Достигнат е лимитът на заявките към Google Gemini. Моля, опитайте по-късно.";
      } else if (errorMessage.includes("401") || errorMessage.includes("API key")) {
          displayMessage = "⚠️ Невалиден Google API ключ.";
      } else if (errorMessage.includes("503") || errorMessage.includes("500")) {
          displayMessage = "⚠️ Сървърът на Google AI е временно недостъпен. Моля, опитайте след малко.";
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
