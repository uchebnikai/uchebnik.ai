
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData } from "../types";
import { SYSTEM_PROMPTS, SUBJECTS } from "../constants";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for retry logic
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.toString().toLowerCase();
    if ((msg.includes('429') || msg.includes('503')) && retries > 0) {
      console.warn(`API Busy. Retrying... Attempts left: ${retries}. Waiting ${delay}ms.`);
      await wait(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper: Vision Analysis using Gemini
// This function strictly sends images to Gemini to get a text description
async function analyzeImages(apiKey: string, images: string[]): Promise<string> {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free", 
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image in extreme detail. Transcribe any text exactly. If there are math problems, describe the numbers, variables, and geometry precisely. If it is a diagram, describe all connections. Return ONLY the description, no conversational filler." },
                    ...images.map(img => ({
                        type: "image_url",
                        image_url: { url: img, detail: "auto" }
                    }))
                ]
            }]
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Vision API Failed: ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
}

// Improved JSON Extractor
function extractJson(text: string): string | null {
  // Try finding Markdown block first
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  if (match && match[1]) {
      return match[1];
  }
  // Fallback: Find first '{' and last '}'
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
  preferredModel: string = 'auto'
): Promise<Message> => {
  
  const apiKey = process.env.OPENROUTER_API_KEY || "";

  if (!apiKey) {
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен OpenRouter API ключ. Моля, добавете го в .env файл.",
          isError: true,
          timestamp: Date.now()
      };
  }

  // Resolve Subject Name for Context
  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  let imageAnalysis = "";

  // STEP 1: If images exist, analyze them with Gemini first (Vision-to-Text)
  if (hasImages) {
      try {
          imageAnalysis = await withRetry(() => analyzeImages(apiKey, imagesBase64));
      } catch (error) {
          console.error("Image analysis failed:", error);
           return {
              id: Date.now().toString(),
              role: 'model',
              text: "Не успях да разчета изображението. Моля, опитайте отново с по-ясна снимка.",
              isError: true,
              timestamp: Date.now()
          };
      }
  }

  // STEP 2: Use DeepSeek R1 for the actual reasoning and response (Text Only)
  let modelName = 'tngtech/deepseek-r1t2-chimera:free'; 
  if (preferredModel !== 'auto' && preferredModel) {
      modelName = preferredModel;
  }

  // IMAGE GENERATION CHECK (Art Mode)
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  // Prepare System Instruction
  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  let forceJson = false;

  if (isImageRequest) {
      // Special instruction for Art/Draw mode
      systemInstruction = `You are an AI that helps with art concepts. 
      IMPORTANT: You CANNOT generate pixel/raster images (PNG/JPG). 
      If the user asks for a drawing, you MUST generate an SVG code block using the json:geometry format.
      
      Format:
      \`\`\`json:geometry
      {
        "title": "Short title",
        "svg": "<svg>...</svg>"
      }
      \`\`\`
      
      If an SVG is not appropriate, describe the image in detail.`;
  } else if (mode === AppMode.LEARN) {
      systemInstruction = SYSTEM_PROMPTS.LEARN;
  } else if (mode === AppMode.SOLVE) {
      systemInstruction = SYSTEM_PROMPTS.SOLVE;
  } else if (mode === AppMode.TEACHER_PLAN) {
      systemInstruction = SYSTEM_PROMPTS.TEACHER_PLAN;
  } else if (mode === AppMode.TEACHER_RESOURCES) {
      systemInstruction = SYSTEM_PROMPTS.TEACHER_RESOURCES;
  } else if (mode === AppMode.TEACHER_TEST) {
      systemInstruction = SYSTEM_PROMPTS.TEACHER_TEST;
      forceJson = true;
  } else if (mode === AppMode.PRESENTATION) {
      systemInstruction = SYSTEM_PROMPTS.PRESENTATION;
      forceJson = true;
  }

  // Add JSON enforcement for structured modes
  if (forceJson) {
      systemInstruction += "\n\nIMPORTANT: YOU MUST RETURN VALID JSON ONLY. NO MARKDOWN BLOCK WRAPPING THE JSON (IF POSSIBLE), JUST THE JSON STRING.";
  }

  // Enforce Thinking Tags
  systemInstruction += "\n\nIMPORTANT: If you use internal reasoning or chain-of-thought, you MUST enclose it strictly within <think> and </think> tags. Do NOT output raw thinking text without tags.";

  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  // Prepare Messages
  const messages: any[] = [];

  // Add history (Text only)
  // BUG FIX: Incorporate image context from previous messages if available
  history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides').forEach(msg => {
      let content = msg.text;
      if (msg.imageAnalysis) {
          content += `\n\n[CONTEXT FROM ATTACHED IMAGE: ${msg.imageAnalysis}]`;
      }
      messages.push({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: content
      });
  });

  // Construct Final User Prompt
  let finalUserPrompt = promptText;
  
  // Inject Image Analysis result into the prompt for DeepSeek
  if (imageAnalysis) {
      finalUserPrompt = `[IMAGE CONTEXT]: The user has attached an image. Here is the detailed description of it:\n${imageAnalysis}\n\n[USER REQUEST]: ${promptText}`;
  }

  if (mode === AppMode.TEACHER_TEST) {
      const prevTest = history.find(m => m.type === 'test_generated')?.testData;
      if (prevTest) {
          finalUserPrompt = `[PREVIOUS TEST CONTEXT]: ${JSON.stringify(prevTest)}\n\nUSER REQUEST: ${finalUserPrompt}`;
      }
  }

  // System Prompt Strategy for DeepSeek
  finalUserPrompt = `[SYSTEM INSTRUCTION]: ${systemInstruction}\n\n[USER REQUEST]: ${finalUserPrompt}`;

  messages.push({ role: "user", content: finalUserPrompt });

  const requestBody: any = {
      model: modelName,
      messages: messages,
      // No sampling params for reasoning models
  };

  try {
      const performGenerate = async () => {
          const res = await fetch(API_URL, {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody)
          });

          if (!res.ok) {
              const errText = await res.text();
              console.error("OpenRouter API Error Body:", errText); 
              throw new Error(`API Error: ${res.status} ${errText}`);
          }
          return res.json();
      };

      const data = await withRetry(performGenerate);
      let text = data.choices?.[0]?.message?.content || "Няма отговор.";

      // CLEANUP LOGIC: Remove <think> blocks
      if (text.includes('</think>')) {
          const parts = text.split('</think>');
          text = parts[parts.length - 1];
      }
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      // Post-processing for JSON modes
      if (mode === AppMode.PRESENTATION) {
         try {
             const jsonStr = extractJson(text);
             if (jsonStr) {
                 const slides: Slide[] = JSON.parse(jsonStr);
                 return {
                     id: Date.now().toString(),
                     role: 'model',
                     text: "Готово! Ето план за твоята презентация:",
                     type: 'slides',
                     slidesData: slides,
                     timestamp: Date.now(),
                     imageAnalysis: imageAnalysis // Return context so App.tsx can save it
                 };
             } else {
                 throw new Error("No JSON found");
             }
         } catch (e) {
             console.error("Presentation JSON parse error", e);
         }
      }

      if (mode === AppMode.TEACHER_TEST) {
          try {
             const jsonStr = extractJson(text);
             if (jsonStr) {
                 const testData: TestData = JSON.parse(jsonStr);
                 return {
                     id: Date.now().toString(),
                     role: 'model',
                     text: `Готово! Ето теста на тема: ${testData.title || promptText}`,
                     type: 'test_generated',
                     testData: testData,
                     timestamp: Date.now(),
                     imageAnalysis: imageAnalysis
                 };
             } else {
                throw new Error("No JSON found");
             }
          } catch (e) {
              console.error("Test JSON parse error", e);
          }
      }

      // Check for Charts/Geometry
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
          timestamp: Date.now(),
          imageAnalysis: imageAnalysis
      };

  } catch (error: any) {
      console.error("DeepSeek API Error:", error);
      
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Възникна грешка при връзката с DeepSeek. Моля, опитайте отново.",
          isError: true,
          timestamp: Date.now()
      };
  }
};
