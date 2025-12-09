
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

  // IMAGE GENERATION CHECK
  const imageKeywords = /(draw|paint|generate image|create a picture|make an image|нарисувай|рисувай|генерирай изображение|генерирай снимка|направи снимка|изображение на)/i;
  const isImageRequest = (subjectId === SubjectId.ART && mode === AppMode.DRAW) || imageKeywords.test(promptText);

  if (isImageRequest) {
      // DeepSeek doesn't generate images. We'll offer SVG generation instead or explain limitation.
      if (!promptText.toLowerCase().includes('svg') && !promptText.toLowerCase().includes('чертеж')) {
           return {
            id: Date.now().toString(),
            role: 'model',
            text: "Този модел (DeepSeek) не поддържа генериране на изображения (снимки). Мога обаче да генерирам SVG чертежи и диаграми за математика, физика и други предмети. Опитайте да поискате 'чертеж' или 'диаграма'.",
            timestamp: Date.now()
          };
      }
  }

  // Determine Model
  let modelName = 'tngtech/deepseek-r1t-chimera:free'; // Default Free
  if (preferredModel !== 'auto') {
    modelName = preferredModel;
  }

  // Prepare System Instruction
  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  if (mode === AppMode.LEARN) systemInstruction = SYSTEM_PROMPTS.LEARN;
  else if (mode === AppMode.SOLVE) systemInstruction = SYSTEM_PROMPTS.SOLVE;
  else if (mode === AppMode.TEACHER_PLAN) systemInstruction = SYSTEM_PROMPTS.TEACHER_PLAN;
  else if (mode === AppMode.TEACHER_RESOURCES) systemInstruction = SYSTEM_PROMPTS.TEACHER_RESOURCES;
  else if (mode === AppMode.TEACHER_TEST) systemInstruction = SYSTEM_PROMPTS.TEACHER_TEST;
  else if (mode === AppMode.PRESENTATION) systemInstruction = SYSTEM_PROMPTS.PRESENTATION;

  // Add JSON enforcement for structured modes
  if (mode === AppMode.PRESENTATION || mode === AppMode.TEACHER_TEST) {
      systemInstruction += "\n\nIMPORTANT: YOU MUST RETURN VALID JSON ONLY. NO MARKDOWN BLOCK, JUST THE JSON STRING.";
  }

  // CRITICAL: Enforce Thinking Tags to allow filtering
  systemInstruction += "\n\nIMPORTANT: If you use internal reasoning or chain-of-thought, you MUST enclose it strictly within <think> and </think> tags. Do NOT output raw thinking text without tags.";

  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  // Prepare Messages
  const messages: any[] = [
      { role: "system", content: systemInstruction }
  ];

  // Add history (text only, as DeepSeek R1 is text focused usually)
  history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides').forEach(msg => {
      messages.push({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text
      });
  });

  // Current User Message
  let finalUserPrompt = promptText;
  if (mode === AppMode.TEACHER_TEST) {
      // If editing a test, inject context logic similar to Gemini service
      const prevTest = history.find(m => m.type === 'test_generated')?.testData;
      if (prevTest) {
          finalUserPrompt = `[PREVIOUS TEST CONTEXT]: ${JSON.stringify(prevTest)}\n\nUSER REQUEST: ${promptText}`;
      }
  }

  messages.push({ role: "user", content: finalUserPrompt });

  try {
      const performGenerate = async () => {
          const res = await fetch(API_URL, {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": window.location.origin, // Required by OpenRouter
                  "X-Title": "Uchebnik AI"
              },
              body: JSON.stringify({
                  model: modelName,
                  messages: messages,
                  temperature: 0.7
              })
          });

          if (!res.ok) {
              const errText = await res.text();
              throw new Error(`API Error: ${res.status} ${errText}`);
          }
          return res.json();
      };

      const data = await withRetry(performGenerate);
      let text = data.choices?.[0]?.message?.content || "Няма отговор.";

      // CLEANUP LOGIC: Remove <think> blocks common in DeepSeek R1 models
      
      // Strategy 1: If we see a closing </think> tag, assume everything before it is garbage thinking.
      // This handles cases where the opening <think> might be missing or malformed at the very start.
      if (text.includes('</think>')) {
          const parts = text.split('</think>');
          // Take the last part (the actual response)
          text = parts[parts.length - 1];
      }

      // Strategy 2: Remove any remaining proper <think>...</think> blocks (e.g. if they appear in middle)
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

      // Strategy 3: Trim whitespace left over
      text = text.trim();

      // Post-processing for JSON modes
      if (mode === AppMode.PRESENTATION) {
         try {
             // Extract JSON if wrapped in code block
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
             // Fallback to text
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

      // Check for Charts/Geometry in normal response
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
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Възникна грешка при връзката с DeepSeek. Моля, опитайте отново.",
          isError: true,
          timestamp: Date.now()
      };
  }
};
