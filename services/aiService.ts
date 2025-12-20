
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData, TeachingStyle } from "../types";
import { getSystemPrompt, SUBJECTS } from "../constants";
import { Language } from '../utils/translations';

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Improved JSON Extractor
function extractJson(text: string): string | null {
  // If the model returns pure JSON without markdown blocks (common with responseMimeType)
  const trimmed = text.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return trimmed;
  }

  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  if (match && match[1]) {
      return match[1];
  }
  
  // Try to find the first { or [ and the last } or ]
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  
  let start = -1;
  if (startObj !== -1 && startArr !== -1) start = Math.min(startObj, startArr);
  else if (startObj !== -1) start = startObj;
  else if (startArr !== -1) start = startArr;

  const endObj = text.lastIndexOf('}');
  const endArr = text.lastIndexOf(']');
  
  let end = -1;
  if (endObj !== -1 && endArr !== -1) end = Math.max(endObj, endArr);
  else if (endObj !== -1) end = endObj;
  else if (endArr !== -1) end = endArr;

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
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";
  const modelName = 'gemini-2.5-flash';

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  // Detect Test Creation Intent - Relaxed Regex
  const testKeywords = /(create|make|generate|write|създай|направи|генерирай|изготви)[\s\S]*?(test|exam|quiz|questions|тест|изпит|контролно|въпроси)/i;
  const isTestRequest = mode === AppMode.TEACHER_TEST || testKeywords.test(promptText);

  // Determine effective mode for system prompt
  let effectiveMode = mode;
  if (isTestRequest && mode !== AppMode.TEACHER_TEST) {
      effectiveMode = AppMode.TEACHER_TEST;
  }

  // Get localized system prompt based on mode, language, and teaching style
  let systemInstruction = getSystemPrompt(isImageRequest ? 'DRAW' : effectiveMode, language, teachingStyle, customPersona);
  
  // Configuration for the model
  const config: any = {
      systemInstruction: `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`,
  };

  // Force JSON for specific modes
  if (effectiveMode === AppMode.TEACHER_TEST || effectiveMode === AppMode.PRESENTATION) {
      config.responseMimeType = 'application/json';
  }

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
      
      if (effectiveMode === AppMode.TEACHER_TEST) {
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

      const chat = ai.chats.create({
          model: modelName,
          config: config,
          history: historyContents
      });

      const result = await chat.sendMessageStream({ message: currentParts });
      
      let finalContent = "";
      let fullText = "";

      for await (const chunk of result) {
          if (signal?.aborted) break;

          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              finalContent = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
              if (onStreamUpdate) {
                  onStreamUpdate(finalContent, "");
              }
          }
      }

      let processedText = fullText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

      // Presentation Detection
      if (effectiveMode === AppMode.PRESENTATION) {
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
                     reasoning: ""
                 };
             }
         } catch (e) { console.error("Presentation JSON parse error", e); }
      }

      // Test Detection logic (Now opportunistic - runs even if effectiveMode wasn't set perfectly, if JSON is present)
      // We check if it WAS a test request OR if the output looks like a test JSON
      const looksLikeJson = (processedText.trim().startsWith('{') || processedText.trim().startsWith('[') || processedText.includes('```json'));
      
      if (effectiveMode === AppMode.TEACHER_TEST || looksLikeJson) {
          try {
             const jsonStr = extractJson(processedText);
             if (jsonStr) {
                 let parsedData = JSON.parse(jsonStr);
                 
                 // Normalize: Handle case where AI returns an Array (either of strings or objects) instead of the TestData object
                 let isTestArray = false;
                 if (Array.isArray(parsedData)) {
                     // Check if it looks like a test array (has questions or is strings)
                     if (parsedData.length > 0 && (typeof parsedData[0] === 'string' || parsedData[0].question)) {
                         isTestArray = true;
                         const normalizedQuestions = parsedData.map((q: any, index: number) => {
                             if (typeof q === 'string') {
                                 return {
                                     id: index + 1,
                                     question: q,
                                     type: 'open_answer',
                                     options: [],
                                     correctAnswer: 'Виж в ключа' 
                                 };
                             }
                             return { 
                                 id: q.id || index + 1,
                                 question: q.question || "Въпрос",
                                 type: q.type || (q.options ? 'multiple_choice' : 'open_answer'),
                                 options: q.options || [],
                                 correctAnswer: q.correctAnswer || q.answer || 'Виж в ключа',
                                 geometryData: q.geometryData,
                                 chartData: q.chartData
                             };
                         });

                         parsedData = {
                             title: promptText.length < 50 ? promptText : "Генериран Тест",
                             subject: subjectName,
                             grade: "",
                             questions: normalizedQuestions
                         };
                     }
                 } else if (parsedData && Array.isArray(parsedData.questions)) {
                     // Even if it is an object, ensure questions inside are normalized
                     parsedData.questions = parsedData.questions.map((q: any, index: number) => {
                         if (typeof q === 'string') {
                             return {
                                 id: index + 1,
                                 question: q,
                                 type: 'open_answer',
                                 options: [],
                                 correctAnswer: 'Виж в ключа'
                             };
                         }
                         return { 
                             id: q.id || index + 1,
                             question: q.question || "Въпрос",
                             type: q.type || (q.options ? 'multiple_choice' : 'open_answer'),
                             options: q.options || [],
                             correctAnswer: q.correctAnswer || q.answer || 'Виж в ключа',
                             geometryData: q.geometryData,
                             chartData: q.chartData
                         };
                     });
                 }

                 // Validate minimal structure to confirm it's actually a test
                 if (parsedData && (parsedData.questions || isTestArray)) {
                     const testData: TestData = parsedData;
                     return {
                         id: Date.now().toString(),
                         role: 'model',
                         text: `Готово! Ето теста: ${testData.title || "Нов Тест"}`,
                         type: 'test_generated',
                         testData: testData,
                         timestamp: Date.now(),
                         reasoning: ""
                     };
                 }
             }
          } catch (e) { 
              // Only log if we were EXPECTING a test
              if (effectiveMode === AppMode.TEACHER_TEST) {
                  console.error("Test JSON parse error", e); 
              }
          }
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
          reasoning: ""
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
