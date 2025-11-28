
import { GoogleGenAI, Type } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

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
    apiKey = process.env.GOOGLE_API_KEY || "";
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

      const response = await ai.models.generateContent({
        model: model, 
        contents: enhancedPrompt,
        config: {
           imageConfig: {
             aspectRatio: aspectRatio
           }
        }
      });
      
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
        text: "Възникна грешка при генерирането на изображение.", 
        isError: true,
        timestamp: Date.now()
      };
    }
  }

  // 2. PRESENTATION LOGIC
  if (subjectId === SubjectId.ART && mode === AppMode.PRESENTATION) {
    try {
      const response = await ai.models.generateContent({
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
      });

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

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

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
        errorMsg = `Грешка 404: Моделът (${modelName}) не е намерен или нямате достъп до него.`;
    } else if (rawError.includes("429")) {
        errorMsg = "Грешка 429: Твърде много заявки. Моля, изчакайте малко.";
    } else if (rawError.includes("fetch failed") || rawError.includes("NetworkError")) {
        errorMsg = "Мрежова грешка. Проверете интернет връзката си.";
    } else {
        // Show a bit of the technical error to help diagnosis
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
