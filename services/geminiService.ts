import { AppMode, SubjectId, Slide, ChartData, GeometryData, Message, TestData, UserPlan } from "../types";
import { SYSTEM_PROMPTS, SUBJECTS } from "../constants";

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to extract JSON from markdown or raw text
function extractJSON(text: string): any {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from markdown code blocks
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

export const generateResponse = async (
  subjectId: SubjectId,
  mode: AppMode,
  promptText: string,
  imagesBase64: string[] = [],
  history: Message[] = [],
  preferredModel: string = 'auto',
  userPlan: UserPlan = 'free'
): Promise<Message> => {
  
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";

  if (!apiKey) {
      return {
          id: Date.now().toString(),
          role: 'model',
          text: "Грешка: Не е намерен API ключ (VITE_OPENROUTER_API_KEY).",
          isError: true,
          timestamp: Date.now()
      };
  }

  // Resolve Subject Name for Context
  const subjectConfig = SUBJECTS.find(s => s.id === subjectId);
  const subjectName = subjectConfig ? subjectConfig.name : "Unknown Subject";

  // Select Model based on Plan
  const model = (userPlan === 'plus' || userPlan === 'pro') 
    ? 'deepseek-r1t2-chimera' 
    : 'deepseek-r1t-chimera';

  // Determine System Prompt
  let systemInstruction = SYSTEM_PROMPTS.DEFAULT;
  if (mode === AppMode.LEARN) systemInstruction = SYSTEM_PROMPTS.LEARN;
  else if (mode === AppMode.SOLVE) systemInstruction = SYSTEM_PROMPTS.SOLVE;
  else if (mode === AppMode.TEACHER_PLAN) systemInstruction = SYSTEM_PROMPTS.TEACHER_PLAN;
  else if (mode === AppMode.TEACHER_RESOURCES) systemInstruction = SYSTEM_PROMPTS.TEACHER_RESOURCES;
  else if (mode === AppMode.TEACHER_TEST) systemInstruction = SYSTEM_PROMPTS.TEACHER_TEST;
  else if (mode === AppMode.PRESENTATION) systemInstruction = SYSTEM_PROMPTS.PRESENTATION;

  // Inject Subject Context
  systemInstruction = `CURRENT SUBJECT CONTEXT: ${subjectName}. All responses must relate to ${subjectName}.\n\n${systemInstruction}`;
  
  // For modes requiring JSON, enforce it strictly in system prompt
  if (mode === AppMode.PRESENTATION || mode === AppMode.TEACHER_TEST) {
    systemInstruction += "\n\nIMPORTANT: OUTPUT ONLY VALID JSON. DO NOT WRAP IN MARKDOWN. NO EXTRA TEXT.";
  }

  // Construct Messages
  const messages: { role: string, content: string }[] = [
    { role: "system", content: systemInstruction }
  ];

  // History Processing
  if (mode === AppMode.TEACHER_TEST) {
      // Special history logic for Teacher Test (injects previous test JSON)
      const testHistory = history.filter(msg => !msg.isError);
      
      testHistory.forEach(msg => {
          let textContent = msg.text;
          // Inject Test JSON if this message was a generated test
          if (msg.type === 'test_generated' && msg.testData) {
              textContent += `\n\n[SYSTEM CONTEXT - PREVIOUS TEST DATA]:\n${JSON.stringify(msg.testData)}`;
          }
          messages.push({
              role: msg.role === 'model' ? 'assistant' : 'user',
              content: textContent
          });
      });
      
      // Inject Current Subject Context into the prompt for tests
      const contextPrompt = `CURRENT SUBJECT CONTEXT: ${subjectName}. The test MUST be about ${subjectName}.\n\nUser Request: ${promptText}`;
      messages.push({ role: 'user', content: contextPrompt });

  } else {
      // Standard History
      // Filter out special types to avoid confusing the text model, or include as text representation
      history
        .filter(msg => !msg.isError && msg.text && msg.type !== 'image_generated' && msg.type !== 'slides')
        .forEach(msg => {
             messages.push({
                 role: msg.role === 'model' ? 'assistant' : 'user',
                 content: msg.text
             });
        });
      
      // Note: DeepSeek R1 models via OpenRouter are primarily text. 
      // We are omitting image inputs from history and prompt to avoid errors.
      messages.push({ role: 'user', content: promptText });
  }

  // Perform API Call
  try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": window.location.origin,
              "X-Title": "uchebnik.ai"
          },
          body: JSON.stringify({
              model: model,
              messages: messages,
              stream: true
          })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }

      // Handle Streaming Response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      if (reader) {
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              const lines = buffer.split('\n');
              buffer = lines.pop() || ""; // Keep the last incomplete line in buffer
              
              for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === 'data: [DONE]') continue;
                  
                  if (trimmed.startsWith('data: ')) {
                      try {
                          const data = JSON.parse(trimmed.slice(6));
                          const content = data.choices[0]?.delta?.content || "";
                          fullText += content;
                      } catch (e) {
                          // Ignore parse errors on partial chunks
                      }
                  }
              }
          }
      }

      // Remove <think> blocks for JSON extraction (clean processing)
      const cleanedText = fullText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      const textToParse = cleanedText || fullText;

      // Post-Processing
      let finalType: Message['type'] = 'text';
      let slidesData: Slide[] | undefined;
      let testData: TestData | undefined;
      let chartData: ChartData | undefined;
      let geometryData: GeometryData | undefined;

      // 1. Presentation Mode
      if (mode === AppMode.PRESENTATION) {
          const slides = extractJSON(textToParse);
          if (slides && Array.isArray(slides)) {
              finalType = 'slides';
              slidesData = slides;
              fullText = "Готово! Ето план за твоята презентация:";
          }
      }

      // 2. Teacher Test Mode
      else if (mode === AppMode.TEACHER_TEST) {
          const test = extractJSON(textToParse);
          if (test && test.questions && Array.isArray(test.questions)) {
              finalType = 'test_generated';
              testData = test;
              fullText = `Готово! Ето теста на тема: ${test.title || promptText}`;
          }
      }

      // 3. Standard Text Mode (Check for charts/geometry)
      else {
          const chartMatch = textToParse.match(/```json:chart\n([\s\S]*?)\n```/);
          if (chartMatch) {
            try {
              chartData = JSON.parse(chartMatch[1]);
              fullText = fullText.replace(chartMatch[0], "").trim();
            } catch (e) {}
          }

          const geoMatch = textToParse.match(/```json:geometry\n([\s\S]*?)\n```/);
          if (geoMatch) {
            try {
              geometryData = JSON.parse(geoMatch[1]);
              fullText = fullText.replace(geoMatch[0], "").trim();
            } catch (e) {}
          }
      }

      return {
          id: Date.now().toString(),
          role: 'model',
          text: fullText,
          type: finalType,
          slidesData,
          testData,
          chartData,
          geometryData,
          timestamp: Date.now()
      };

  } catch (error: any) {
    console.error("AI Service Error:", error);
    return {
      id: Date.now().toString(),
      role: 'model',
      text: "Възникна грешка при връзката с AI (OpenRouter). Моля, опитайте отново.",
      isError: true,
      timestamp: Date.now()
    };
  }
};
