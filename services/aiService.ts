
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData } from "../types";
import { SYSTEM_PROMPTS, SUBJECTS } from "../constants";

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for retry logic
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error.toString().toLowerCase();
    // Don't retry if it's a client error (4xx)
    if (msg.includes('400') || msg.includes('401') || msg.includes('403')) {
        throw error;
    }
    if (retries > 0) {
      console.warn(`API Busy/Error. Retrying... Attempts left: ${retries}. Waiting ${delay}ms. Error: ${msg}`);
      await wait(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
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

// Analyze images using Gemini 2.5 Flash
async function analyzeImages(apiKey: string, imagesBase64: string[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct parts: Images + Prompt
    const parts: any[] = [];
    
    for (const base64 of imagesBase64) {
        // Strip prefix if present (data:image/jpeg;base64,)
        const data = base64.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = base64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
        parts.push({
            inlineData: {
                data: data,
                mimeType: mimeType
            }
        });
    }
    
    parts.push({ text: "Analyze this image in extreme detail. Transcribe any text exactly. If there are math problems, describe the numbers, variables, and geometry precisely. If it is a diagram, describe all connections. Return ONLY the description, no conversational filler." });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts }
    });

    return response.text || "";
}

export const generateResponse = async (
  subjectId: SubjectId,
  mode: AppMode,
  promptText: string,
  imagesBase64?: string[],
  history: Message[] = [],
  preferredModel: string = 'gemini-2.5-flash', // Ignored as we force 2.5 Flash
  onStreamUpdate?: (text: string, reasoning: string) => void
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
  let imageAnalysis = "";

  // Strategy: Analyze images to get text context for history, but use actual images for current turn generation
  if (hasImages) {
      try {
          imageAnalysis = await withRetry(() => analyzeImages(apiKey, imagesBase64));
      } catch (error) {
          console.error("Image analysis failed:", error);
          // Non-fatal, we will still try to generate response with the images attached
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

  // Thinking config is enabled by default or auto in 2.5 Flash, but we can encourage reasoning in prompt or config
  // systemInstruction += "\n\nIMPORTANT: Show your reasoning process enclosed in <think> tags before your final answer."; 
  // Gemini 2.5 Flash with thinking might handle this natively or we simulate via prompt. 
  // Since we want to parse <think> tags for UI, we instruct it.
  systemInstruction += "\n\nIMPORTANT: Before answering, explain your reasoning step-by-step enclosed in <think> tags.";

  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;

  try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Construct history
      const historyContents: any[] = [];
      
      history.filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides').forEach(msg => {
          let content = msg.text;
          if (msg.imageAnalysis) {
              content += `\n\n[CONTEXT FROM ATTACHED IMAGE: ${msg.imageAnalysis}]`;
          }
          historyContents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: content }]
          });
      });

      // Construct current message parts
      const currentParts: any[] = [];
      
      let finalUserPrompt = promptText;
      // If we have previous image analysis but no current images, it's already in history logic above? 
      // No, `imageAnalysis` variable here refers to the *current* upload.
      
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
              // thinkingConfig: { thinkingBudget: 1024 } // Optional: enable if desired and supported
          },
          history: historyContents
      });

      // Stream response
      // GoogleGenAI chat.sendMessageStream takes a string or parts. 
      // Since we might have images in the *current* turn, we pass `currentParts`.
      // Note: `chat.sendMessageStream` signature expects `string | Part[] | ...`
      // But SDK guidelines say: "chat.sendMessageStream only accepts the message parameter".
      // Correct usage: chat.sendMessageStream({ message: ... }) is for newer SDK, but standard is `chat.sendMessageStream(message)`.
      // The guidelines say: "chat.sendMessageStream only accepts the message parameter, do not use contents."
      // The `message` parameter can be a string or an array of parts.
      
      const result = await chat.sendMessageStream(currentParts);
      
      let finalContent = "";
      let finalReasoning = "";
      let fullText = "";

      for await (const chunk of result) {
          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              
              // Simple parsing for <think> tags during stream
              // This is a basic implementation; robust parsing of streaming XML tags is complex.
              // We'll update the UI with raw text and let the UI regex handle finalized tags, 
              // or attempt to separate if possible.
              
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
