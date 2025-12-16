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

// Vision Analysis using specific Gemma model
async function analyzeImages(apiKey: string, images: string[], model: string): Promise<string> {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://uchebnik.ai",
            "X-Title": "Uchebnik AI"
        },
        body: JSON.stringify({
            model: model, 
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
  preferredModel: string = 'google/gemma-3-4b-it:free',
  onStreamUpdate?: (text: string, reasoning: string) => void
): Promise<Message> => {
  
  // Access key from multiple sources to be robust
  // @ts-ignore
  let apiKey = typeof process !== 'undefined' && process.env ? process.env.OPENROUTER_API_KEY : "";
  if (!apiKey) {
      apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || "";
  }

  if (!apiKey) {
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен OpenRouter API ключ. Моля, проверете настройките на Vercel (VITE_OPENROUTER_API_KEY) или .env файла.",
          isError: true,
          timestamp: Date.now()
      };
  }

  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";

  const modelName = preferredModel; // Strictly use what is passed (based on plan)

  const hasImages = imagesBase64 && imagesBase64.length > 0;
  let imageAnalysis = "";

  if (hasImages) {
      try {
          // Pass the model to analyzeImages too, assuming it handles vision or we rely on it
          imageAnalysis = await withRetry(() => analyzeImages(apiKey, imagesBase64, modelName));
      } catch (error) {
          console.error("Image analysis failed:", error);
           return {
              id: Date.now().toString(),
              role: 'model',
              text: "Не успях да разчета изображението. Моля, опитайте отново с по-ясна снимка или проверете дали моделът поддържа изображения.",
              isError: true,
              timestamp: Date.now()
          };
      }
  }

  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  let forceJson = false;

  if (isImageRequest) {
      systemInstruction = `You are an AI that helps with art concepts and geometry. 
      IMPORTANT: You CANNOT generate pixel/raster images (PNG/JPG). 
      If the user asks for a drawing, you MUST generate an SVG code block using the json:geometry format.
      
      GEOMETRY GUIDELINES:
      - Use <path> commands to draw arcs for angles.
      - Label angles clearly with degrees (e.g. 45°) using <text>.
      - Ensure text labels do not overlap lines.
      - Use font-size 14-16 for labels.
      - Use stroke-width="2" for main lines.
      
      Format: \`\`\`json:geometry { "title": "...", "svg": "..." } \`\`\``;
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

  if (forceJson) {
      systemInstruction += "\n\nIMPORTANT: YOU MUST RETURN VALID JSON ONLY. NO MARKDOWN BLOCK WRAPPING THE JSON (IF POSSIBLE), JUST THE JSON STRING.";
  }

  systemInstruction += "\n\nIMPORTANT: Show your reasoning process enclosed in <think> tags before your final answer.";
  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  const messages: any[] = [];

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

  let finalUserPrompt = promptText;
  if (imageAnalysis) {
      finalUserPrompt = `[IMAGE CONTEXT]: ${imageAnalysis}\n\n[USER REQUEST]: ${promptText}`;
  }

  if (mode === AppMode.TEACHER_TEST) {
      const prevTest = history.find(m => m.type === 'test_generated')?.testData;
      if (prevTest) {
          finalUserPrompt = `[PREVIOUS TEST CONTEXT]: ${JSON.stringify(prevTest)}\n\nUSER REQUEST: ${finalUserPrompt}`;
      }
  }

  finalUserPrompt = `[SYSTEM INSTRUCTION]: ${systemInstruction}\n\n[USER REQUEST]: ${finalUserPrompt}`;
  messages.push({ role: "user", content: finalUserPrompt });

  const requestBody: any = {
      model: modelName,
      messages: messages,
      include_reasoning: true,
      stream: true
  };

  try {
      const response = await fetch(API_URL, {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://uchebnik.ai",
              "X-Title": "Uchebnik AI"
          },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          const errText = await response.text();
          console.error(`OpenRouter API Error (${response.status}): ${errText}`);
          throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let finalContent = "";
      let finalReasoning = "";
      let rawAccumulator = "";

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
              if (line.trim().startsWith("data: ")) {
                  const jsonStr = line.replace("data: ", "").trim();
                  if (jsonStr === "[DONE]") break;
                  
                  try {
                      const data = JSON.parse(jsonStr);
                      const delta = data.choices?.[0]?.delta;
                      
                      if (delta) {
                          if (delta.reasoning) {
                              finalReasoning += delta.reasoning;
                          }
                          
                          if (delta.content) {
                              rawAccumulator += delta.content;
                          }

                          let displayContent = rawAccumulator;
                          let displayReasoning = finalReasoning;

                          const thinkMatch = rawAccumulator.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
                          if (thinkMatch) {
                              displayReasoning = (finalReasoning + thinkMatch[1]).trim();
                              displayContent = rawAccumulator.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
                          }

                          if (onStreamUpdate) {
                              onStreamUpdate(displayContent, displayReasoning);
                          }
                      }
                  } catch (e) {
                      console.error("Error parsing stream chunk", e);
                  }
              }
          }
      }

      let processedText = rawAccumulator;
      
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
                     imageAnalysis: imageAnalysis,
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
                     imageAnalysis: imageAnalysis,
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
          imageAnalysis: imageAnalysis,
          reasoning: finalReasoning
      };

  } catch (error: any) {
      console.error("AI API Error:", error);
      const errorMessage = error.message || "Unknown error";
      return {
          id: Date.now().toString(),
          role: 'model',
          text: `Възникна грешка при връзката с AI (Google Gemma): ${errorMessage}. Моля, опитайте отново или проверете ключа.`,
          isError: true,
          timestamp: Date.now()
      };
  }
};