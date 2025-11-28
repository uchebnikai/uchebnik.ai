
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for retry logic with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.toString().toLowerCase();
    // 429: Too Many Requests, 503: Service Unavailable
    // Also catch "resource exhausted" which is the text representation of 429
    if ((msg.includes('429') || msg.includes('503') || msg.includes('resource exhausted')) && retries > 0) {
      console.warn(`Gemini API Busy (429/503). Retrying... Attempts left: ${retries}. Waiting ${delay}ms.`);
      await wait(delay);
      return withRetry(fn, retries - 1, delay * 2); // Exponential backoff: 2s, 4s, 8s
    }
    throw error;
  }
}

export const generateResponse = async (
  subjectId: SubjectId,
  mode: AppMode,
  promptText: string,
  imagesBase64?: string[],
  history: Message[] = [],
  preferredModel: string = 'auto'
): Promise<Message> => { // Explicit return type
  
  let apiKey = "";
  try {
    // Try both naming conventions to be safe
    apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
  } catch (e) {
    console.error("Environment variable access error:", e);
  }

  if (!apiKey) {
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен API ключ (GOOGLE_API_KEY). Моля, проверете настройките на Environment Variables във Vercel.",
          isError: true,
          timestamp: Date.now()
      };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 1. IMAGE GENERATION LOGIC (Global Detection)
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  if (isImageRequest) {
    try {
      const model = 'gemini-2.5-flash-image';
      
      let aspectRatio = "1:1";
      if (promptText.match(/16[:\s]9|landscape|широк|пейзаж/i)) aspectRatio = "16:9";
      else if (promptText.match(/9[:\s]16|portrait|портрет/i)) aspectRatio = "9:16";
      else if (promptText.match(/4[:\s]3/)) aspectRatio = "4:3";
      else if (promptText.match(/3[:\s]4/)) aspectRatio = "3:4";

      const enhancedPrompt = promptText + " . high quality, realistic, detailed, 8k resolution";

      // Apply retry logic for images
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: model, 
        contents: enhancedPrompt,
        config: {
           imageConfig: {
             aspectRatio: aspectRatio
           }
        }
      }));
      
      let generatedImageBase64: string | undefined;

      const candidates = response?.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts;
        if (parts && Array.isArray(parts)) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              generatedImageBase64 = part.inlineData.data;
              break;
            }
          }
        }
      }

      if (generatedImageBase64) {
        return {
          id: Date.now().toString(),
          role: 'model',
          text: "Ето изображението, което генерирах за теб:",
          images: [`data:image/png;base64,${generatedImageBase64}`],
          type: 'image_generated',
          timestamp: Date.now()
        };
      } else {
         let textResponse = "Не успях да генерирам изображение.";
         try {
             if (response.text) textResponse = response.text;
         } catch (e) {}
         
         return { 
           id: Date.now().toString(),
           role: 'model',
           text: textResponse,
           timestamp: Date.now()
         };
      }

    } catch (e) {
      console.error("Image gen error", e);
      return { 
        id: Date.now().toString(),
        role: 'model',
        text: "Възникна грешка при генерирането на изображение. Моля, опитайте отново по-късно.", 
        isError: true,
        timestamp: Date.now()
      };
    }
  }

  // 2. PRESENTATION LOGIC
  if (subjectId === SubjectId.ART && mode === AppMode.PRESENTATION) {
    try {
      // Apply retry logic for presentation
      const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: SYSTEM_PROMPTS.PRESENTATION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                notes: { type: Type.STRING }
              },
              required: ["title", "content", "notes"]
            }
          }
        }
      }));

      const jsonStr = response.text;
      const slides: Slide[] = JSON.parse(jsonStr || "[]");
      
      return {
        id: Date.now().toString(),
        role: 'model',
        text: "Готово! Ето план за твоята презентация:",
        type: 'slides',
        slidesData: slides,
        timestamp: Date.now()
      };
    } catch (e) {
      console.error("Presentation gen error", e);
      return { 
        id: Date.now().toString(),
        role: 'model',
        text: "Не успях да създам структурата на презентацията.", 
        isError: true,
        timestamp: Date.now()
      };
    }
  }

  // 3. TEXT & CHAT LOGIC
  let modelName = 'gemini-2.5-flash';
  if (preferredModel !== 'auto') {
    modelName = preferredModel;
  } else {
    if ([SubjectId.MATH, SubjectId.PHYSICS, SubjectId.CHEMISTRY, SubjectId.IT].includes(subjectId)) {
      modelName = 'gemini-3-pro-preview';
    } else {
      modelName = 'gemini-2.5-flash';
    }
  }

  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  if (mode === AppMode.LEARN) systemInstruction = SYSTEM_PROMPTS.LEARN;
  else if (mode === AppMode.SOLVE) systemInstruction = SYSTEM_PROMPTS.SOLVE;

  try {
    const contents: any[] = history
      .filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated') 
      .map(msg => {
        const parts: any[] = [];
        if (msg.images && msg.images.length > 0) {
           msg.images.forEach(img => {
             const match = img.match(/^data:(.+);base64,(.+)$/);
             if (match) {
               parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
             }
           });
        }
        parts.push({ text: msg.text });
        return { role: msg.role, parts: parts };
      });

    const currentParts: any[] = [];
    if (imagesBase64 && imagesBase64.length > 0) {
      imagesBase64.forEach(img => {
        const match = img.match(/^data:(.+);base64,(.+)$/);
        if (match) {
          currentParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      });
    }
    currentParts.push({ text: promptText || " " });
    
    contents.push({ role: 'user', parts: currentParts });

    const performGenerate = async (mName: string) => {
        return await ai.models.generateContent({
            model: mName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
            }
        });
    };

    let response: GenerateContentResponse;
    
    try {
        // Attempt with retry
        response = await withRetry(() => performGenerate(modelName));
    } catch (err: any) {
        const errStr = err.toString().toLowerCase();
        // Fallback Logic: If Pro model fails with Rate Limit or Service Unavailable, try Flash
        // This is crucial for avoiding 429s on the heavier model
        if (modelName !== 'gemini-2.5-flash' && (errStr.includes('429') || errStr.includes('503') || errStr.includes('resource exhausted'))) {
            console.warn(`Model ${modelName} failed with rate limit. Falling back to gemini-2.5-flash.`);
            response = await withRetry(() => performGenerate('gemini-2.5-flash'));
            // Optionally append a note to the text (handled below if we wanted)
        } else {
            throw err; // Re-throw if it's already Flash or a different error
        }
    }

    let text = "Няма отговор.";
    try {
        if(response.text) text = response.text;
    } catch(e) {}
    
    let chartData: ChartData | undefined;
    let geometryData: GeometryData | undefined;

    const chartMatch = text.match(/```json:chart\n([\s\S]*?)\n```/);
    if (chartMatch) {
      try {
        chartData = JSON.parse(chartMatch[1]);
        text = text.replace(chartMatch[0], "").trim();
      } catch (e) {}
    }

    const geoMatch = text.match(/```json:geometry\n([\s\S]*?)\n```/);
    if (geoMatch) {
      try {
        geometryData = JSON.parse(geoMatch[1]);
        text = text.replace(geoMatch[0], "").trim();
      } catch (e) {}
    }

    return {
      id: Date.now().toString(),
      role: 'model',
      text: text,
      type: 'text',
      chartData: chartData,
      geometryData: geometryData,
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMsg = "Възникна грешка при връзката с AI.";
    const rawError = error.message || error.toString();

    // Specific Error Messages for Easier Debugging
    if (rawError.includes("403")) {
        errorMsg = "Грешка 403: Достъпът е отказан. Вероятно API ключът е невалиден или има ограничения за домейна (Vercel).";
    } else if (rawError.includes("404")) {
        errorMsg = `Грешка 404: Моделът не е намерен или нямате достъп до него.`;
    } else if (rawError.includes("429") || rawError.includes("resource exhausted")) {
        errorMsg = "Грешка 429: Твърде много заявки (Rate Limit). Системата опита да повтори заявката, но сървърът е претоварен. Моля, изчакайте малко и опитайте отново.";
    } else if (rawError.includes("fetch failed") || rawError.includes("NetworkError")) {
        errorMsg = "Мрежова грешка. Проверете интернет връзката си.";
    } else {
        errorMsg += ` (Детайли: ${rawError.substring(0, 100)}...)`;
    }

    return {
      id: Date.now().toString(),
      role: 'model',
      text: errorMsg,
      isError: true,
      timestamp: Date.now()
    };
  }
};
