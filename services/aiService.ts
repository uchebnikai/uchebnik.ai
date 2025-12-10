
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
          text: "Грешка: Не е намерен OpenRouter API ключ.",
          isError: true,
          timestamp: Date.now()
      };
  }

  // Resolve Subject Name for Context
  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";

  // Determine Model
  let modelName = 'tngtech/deepseek-r1t2-chimera:free'; 
  if (preferredModel !== 'auto' && preferredModel) {
    modelName = preferredModel;
  }

  // IMAGE GENERATION CHECK
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
  const messages: any[] = [
      { role: "system", content: systemInstruction }
  ];

  // Add history (Text only usually to save tokens/prevent errors)
  history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides').forEach(msg => {
      messages.push({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text 
      });
  });

  // Current User Message Construction
  let finalUserPrompt = promptText;
  let userContent: any;

  if (mode === AppMode.TEACHER_TEST) {
      const prevTest = history.find(m => m.type === 'test_generated')?.testData;
      if (prevTest) {
          finalUserPrompt = `[PREVIOUS TEST CONTEXT]: ${JSON.stringify(prevTest)}\n\nUSER REQUEST: ${promptText}`;
      }
  }

  const hasImages = imagesBase64 && imagesBase64.length > 0;

  // DIRECT IMAGE HANDLING: Send images directly to DeepSeek via OpenRouter multimodal format
  if (hasImages) {
      userContent = [
          { type: "text", text: finalUserPrompt },
          ...imagesBase64.map(img => ({
              type: "image_url",
              image_url: { url: img } // Ensure img is data:image/jpeg;base64,...
          }))
      ];
  } else {
      userContent = finalUserPrompt;
  }

  messages.push({ role: "user", content: userContent });

  // Adjust params for vision requests
  const requestBody: any = {
      model: modelName,
      messages: messages,
  };

  // Some vision models prefer no temperature or specific temp. R1 likes 0.6.
  requestBody.temperature = 0.6;

  try {
      const performGenerate = async () => {
          const res = await fetch(API_URL, {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": window.location.origin,
                  "X-Title": "Uchebnik AI"
              },
              body: JSON.stringify(requestBody)
          });

          if (!res.ok) {
              const errText = await res.text();
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
             const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
             const jsonStr = jsonMatch ? jsonMatch[1] : text;
             const slides: Slide[] = JSON.parse(jsonStr);
             return {
                 id: Date.now().toString(),
                 role: 'model',
                 text: "Готово! Ето план за твоята презентация:",
                 type: 'slides',
                 slidesData: slides,
                 timestamp: Date.now()
             };
         } catch (e) {
             console.error("Presentation JSON parse error", e);
         }
      }

      if (mode === AppMode.TEACHER_TEST) {
          try {
             const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
             const jsonStr = jsonMatch ? jsonMatch[1] : text;
             const testData: TestData = JSON.parse(jsonStr);
             return {
                 id: Date.now().toString(),
                 role: 'model',
                 text: `Готово! Ето теста на тема: ${testData.title || promptText}`,
                 type: 'test_generated',
                 testData: testData,
                 timestamp: Date.now()
             };
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
          timestamp: Date.now()
      };

  } catch (error: any) {
      console.error("DeepSeek API Error:", error);
      
      // Better error message for multimodal issues
      if (hasImages && error.toString().includes("400")) {
          return {
              id: Date.now().toString(),
              role: 'model',
              text: "Избраният AI модел има затруднения с обработката на това изображение. Моля, опитайте да го преоразмерите или използвайте само текст.",
              isError: true,
              timestamp: Date.now()
          };
      }

      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Възникна грешка при връзката с DeepSeek. Моля, опитайте отново.",
          isError: true,
          timestamp: Date.now()
      };
  }
};
