

import { GoogleGenAI, Type } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

// Initialize Gemini Client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (
  subjectId: SubjectId,
  mode: AppMode,
  promptText: string,
  imagesBase64?: string[],
  history: Message[] = [],
  preferredModel: string = 'auto'
): Promise<Message> => { // Explicit return type
  const ai = getClient();
  
  // 1. IMAGE GENERATION LOGIC (Global Detection)
  // Check if the user explicitly wants an image, regardless of the subject
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  if (isImageRequest) {
    try {
      // Use the dedicated image generation model
      const model = 'gemini-2.5-flash-image';
      
      // Detect Aspect Ratio from prompt
      let aspectRatio = "1:1";
      if (promptText.match(/16[:\s]9|landscape|широк|пейзаж/i)) aspectRatio = "16:9";
      else if (promptText.match(/9[:\s]16|portrait|портрет/i)) aspectRatio = "9:16";
      else if (promptText.match(/4[:\s]3/)) aspectRatio = "4:3";
      else if (promptText.match(/3[:\s]4/)) aspectRatio = "3:4";

      // Enhance prompt for better results
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

      // ULTRA-SAFE EXTRACTION: Prevent crashes by checking every level of the object
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
         // Fallback: If no image found, try to get text or return generic error
         // Accessing response.text safely
         let textResponse = "Не успях да генерирам изображение. Възможно е заявката да е била блокирана от филтри за безопасност.";
         try {
             if (response.text) textResponse = response.text;
         } catch (e) {
             // Ignore error accessing .text if it doesn't exist
         }
         
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
        text: "Възникна грешка при генерирането на изображение. Моля, опитайте отново или променете описанието.", 
        isError: true,
        timestamp: Date.now()
      };
    }
  }

  // 2. PRESENTATION LOGIC (Art - Slides)
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
        text: "Готово! Ето план за твоята презентация (можеш да я свалиш като PowerPoint):",
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
  // Standard logic for all other requests
  
  // Determine Model
  let modelName = 'gemini-2.5-flash';
  if (preferredModel !== 'auto') {
    modelName = preferredModel;
  } else {
    // Smart Auto-Selection
    if ([SubjectId.MATH, SubjectId.PHYSICS, SubjectId.CHEMISTRY, SubjectId.IT].includes(subjectId)) {
      modelName = 'gemini-3-pro-preview'; // Smart model for STEM
    } else {
      modelName = 'gemini-2.5-flash'; // Fast model for languages/chat
    }
  }

  // Determine System Instruction
  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  if (mode === AppMode.LEARN) systemInstruction = SYSTEM_PROMPTS.LEARN;
  else if (mode === AppMode.SOLVE) systemInstruction = SYSTEM_PROMPTS.SOLVE;

  try {
    // Prepare History
    const contents: any[] = history
      .filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated') 
      .map(msg => {
        const parts: any[] = [];
        // Add images from history if any
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

    // Prepare Current Message
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

    // Call API
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Safe text extraction
    let text = "Няма отговор.";
    try {
        if(response.text) text = response.text;
    } catch(e) {}
    
    let chartData: ChartData | undefined;
    let geometryData: GeometryData | undefined;

    // Parse Special JSON Blocks (Charts/Geometry)
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

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      id: Date.now().toString(),
      role: 'model',
      text: "Възникна грешка при връзката с AI. Моля опитайте отново.",
      isError: true,
      timestamp: Date.now()
    };
  }
};
