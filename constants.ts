
import { SubjectId, AppMode, SubjectConfig, TeachingStyle } from './types';
import { Language } from './utils/translations';

export const STRIPE_PRICES = {
  FREE: 'price_1SfPSOE0C0vexh9CQmjhJYYX',
  PLUS: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  PRO: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Standard AI', description: 'Бърз и ефективен модел за ежедневни задачи.' },
  { id: 'gemini-3-flash-preview', name: 'Advanced AI', description: 'Най-новият модел от следващо поколение.' }
];

export const VOICES = [
  { id: 'Puck', name: 'Puck (Neutral)' },
  { id: 'Charon', name: 'Charon (Deep)' },
  { id: 'Kore', name: 'Kore (Soft)' },
  { id: 'Fenrir', name: 'Fenrir (Intense)' },
  { id: 'Zephyr', name: 'Zephyr (Calm)' },
];

export const DEFAULT_VOICE = 'Puck';

export const getSystemPrompt = (mode: string, lang: Language, teachingStyle: TeachingStyle = 'normal', customPersona?: string): string => {
  const languageNames: Record<Language, string> = {
    bg: 'Bulgarian',
    en: 'English',
    de: 'German',
    es: 'Spanish',
    tr: 'Turkish',
    fr: 'French',
    it: 'Italian',
    ru: 'Russian',
    zh: 'Chinese (Simplified)',
    ja: 'Japanese',
    ko: 'Korean'
  };
  const targetLang = languageNames[lang] || 'English';

  let personalityInstruction = "";
  
  // Custom Persona overrides Teaching Style if present
  if (customPersona && customPersona.trim().length > 0) {
      personalityInstruction = `IMPORTANT: Adopt the following persona/role strictly: "${customPersona}". Maintain this persona throughout the conversation.`;
  } else {
      switch (teachingStyle) {
        case 'socratic':
          personalityInstruction = "IMPORTANT: Adopt a Socratic teaching style. Do NOT give the final answer immediately. Ask guiding questions to help the user figure it out themselves. Be patient and thoughtful.";
          break;
        case 'eli5':
          personalityInstruction = "IMPORTANT: Explain Like I'm 5 (ELI5). Use extremely simple analogies, basic vocabulary, and short sentences. Avoid complex jargon.";
          break;
        case 'academic':
          personalityInstruction = "IMPORTANT: Use formal, academic language. Be precise with terminology, cite principles where appropriate, and maintain a professional tone.";
          break;
        case 'motivational':
          personalityInstruction = "IMPORTANT: Be an enthusiastic and motivational coach! Use emojis (🚀, ✨, 👏), positive reinforcement, and encouraging words. Celebrate the user's effort.";
          break;
        default:
          personalityInstruction = "Be helpful, polite, and encouraging.";
          break;
      }
  }

  const baseInstructions = `You are a helpful AI assistant for students and teachers. ${personalityInstruction} Help with lessons, solve problems, and answer questions. 
  IMPORTANT: You MUST reply in ${targetLang} language (unless the user specifically asks for another language or it is a language learning subject).`;

  const latexInstructions = `
  IMPORTANT FOR MATH/PHYSICS:
  Always use LaTeX formatting for all mathematical formulas and symbols.
  - Enclose inline formulas with $. Example: "The solution is $x = 5$."
  - Enclose block formulas with $$. Example: "$$\\sqrt{a^2 + b^2}$$".
  - Never write "sqrt", "alpha" as plain text, use $\\sqrt{...}$, $\\alpha$.`;

  const svInstructions = `
  IF A DRAWING/GEOMETRY IS NEEDED:
  Generate SVG code in a JSON block.
  Requirements:
  1. Use viewBox (e.g. "0 0 300 300").
  2. Lines: stroke="black", stroke-width="2".
  3. Points: small circles (r=3), fill="black".
  4. Labels (A, B, C): font-size="16", font-family="sans-serif".
  5. Angles: Draw arcs (<path>) and label degrees.
  
  Format:
  \`\`\`json:geometry
  {
    "title": "Short description",
    "svg": "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'>...</svg>"
  }
  \`\`\`
  `;

  const codingInstructions = `
  IMPORTANT FOR WEB DEVELOPMENT/CODING:
  If the user asks for web code (HTML, CSS, JS) or a website/app:
  1. Return a SINGLE complete index.html code block.
  2. Embed all CSS styles inside <style> tags in the <head>.
  3. Embed all JavaScript logic inside <script> tags in the <body>.
  4. Do not output separate CSS or JS code blocks unless explicitly requested to explain file structure.
  5. This ensures the user can preview the interactive result instantly via the "Preview" button.
  `;

  switch(mode) {
    case 'LEARN':
      return `${baseInstructions}
      You are a teacher. Your goal is to teach the user about a topic. Do not just give answers, explain concepts. Use examples and analogies. Structure information logically.
      ${latexInstructions}
      ${codingInstructions}`;
    
    case 'SOLVE':
      return `${baseInstructions}
      You are an expert problem solver. Solve step-by-step. Explain every step clearly.
      ${latexInstructions}
      ${svInstructions}
      ${codingInstructions}`;

    case 'PRESENTATION':
      return `${baseInstructions}
      Create a presentation plan. Structure it in slides. For each slide give a title, content (bullets), and speaker notes. Return the response ONLY in JSON format array of slides.`;

    case 'TEACHER_TEST':
      return `${baseInstructions}
      You are a teacher's assistant. Create a test.
      Return the result in STRICT JSON format matching the schema:
      {
        "title": "Test Title",
        "subject": "Subject",
        "grade": "Grade",
        "questions": [
           {
             "id": 1,
             "question": "Question text",
             "type": "multiple_choice" | "open_answer",
             "options": ["A) ...", "B) ..."], 
             "correctAnswer": "Correct Answer",
             "geometryData": { "title": "...", "svg": "..." } // Optional
           }
        ]
      }
      Do not use Markdown outside the JSON.
      `;

    case 'TEACHER_PLAN':
      return `${baseInstructions}
      You are a teacher's assistant. Create a detailed lesson plan including: Objectives, Expected Outcomes, Materials, Flow (Intro, Main, Discussion, Conclusion).`;

    case 'TEACHER_RESOURCES':
      return `${baseInstructions}
      You are a teacher's assistant. Suggest additional materials, academic sources, interactive activities, and projects.`;

    default:
      return `${baseInstructions} ${latexInstructions} ${codingInstructions}`;
  }
};

export const SUBJECTS: SubjectConfig[] = [
  {
    id: SubjectId.GENERAL,
    name: 'Общ Чат',
    icon: 'MessageSquare',
    color: 'bg-indigo-500',
    modes: [AppMode.CHAT],
    description: 'Попитай ме каквото и да е.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.MATH,
    name: 'Математика',
    icon: 'Calculator',
    color: 'bg-blue-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгебра, геометрия и задачи.',
    categories: ['school']
  },
  {
    id: SubjectId.BULGARIAN,
    name: 'Български език',
    icon: 'BookOpen',
    color: 'bg-red-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Граматика и литература.',
    categories: ['school']
  },
  {
    id: SubjectId.ENGLISH,
    name: 'Английски език',
    icon: 'Languages',
    color: 'bg-blue-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Превод и упражнения.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.GERMAN,
    name: 'Немски език',
    icon: 'Languages',
    color: 'bg-yellow-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Граматика и лексика.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.RUSSIAN,
    name: 'Руски език',
    icon: 'Languages',
    color: 'bg-red-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Граматика и разговори.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.FRENCH,
    name: 'Френски език',
    icon: 'Languages',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Превод и упражнения.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.SPANISH,
    name: 'Испански език',
    icon: 'Languages',
    color: 'bg-orange-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Граматика и разговори.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.PHYSICS,
    name: 'Физика',
    icon: 'Atom',
    color: 'bg-violet-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Закони и формули.',
    categories: ['school']
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Реакции и елементи.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология',
    icon: 'Dna',
    color: 'bg-emerald-500',
    modes: [AppMode.LEARN],
    description: 'Живот и природа.',
    categories: ['school']
  },
  {
    id: SubjectId.HISTORY,
    name: 'История',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.LEARN],
    description: 'Събития и дати.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География',
    icon: 'Globe',
    color: 'bg-cyan-500',
    modes: [AppMode.LEARN],
    description: 'Държави и карти.',
    categories: ['school']
  },
  {
    id: SubjectId.MUSIC,
    name: 'Музика',
    icon: 'Music',
    color: 'bg-pink-400',
    modes: [AppMode.LEARN],
    description: 'Теория и история.',
    categories: ['school']
  },
  {
    id: SubjectId.JAPANESE,
    name: 'Японски език',
    icon: 'Languages',
    color: 'bg-red-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Кандзи и култура.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.IT,
    name: 'Информатика',
    icon: 'Cpu',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Програмиране и технологии.',
    categories: ['school']
  },
  {
    id: SubjectId.TECHNOLOGIES,
    name: 'Технологии',
    icon: 'Wrench',
    color: 'bg-slate-500',
    modes: [AppMode.LEARN],
    description: 'Предприемачество и техника.',
    categories: ['school']
  },
  {
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-400',
    modes: [AppMode.LEARN],
    description: 'Логика и етика.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.CITIZENSHIP,
    name: 'Гражданско Образование',
    icon: 'Users',
    color: 'bg-indigo-400',
    modes: [AppMode.LEARN],
    description: 'Права и общество.',
    categories: ['school']
  },
  {
    id: SubjectId.RELIGION,
    name: 'Религия',
    icon: 'Book',
    color: 'bg-amber-700',
    modes: [AppMode.LEARN],
    description: 'Вяра и история.',
    categories: ['school']
  },
  {
    id: SubjectId.ART,
    name: 'Изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.DRAW, AppMode.PRESENTATION, AppMode.LEARN],
    description: 'Рисуване и дизайн.',
    categories: ['school', 'university']
  },
  {
    id: SubjectId.PE,
    name: 'Спорт',
    icon: 'Activity',
    color: 'bg-orange-500',
    modes: [AppMode.LEARN],
    description: 'Фитнес и здраве.',
    categories: ['school']
  },
  
  // UNIVERSITY SPECIFIC SUBJECTS (Bulgarian Context)
  {
    id: SubjectId.HIGHER_MATH,
    name: 'Висша Математика',
    icon: 'Sigma',
    color: 'bg-blue-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Анализ, Алгебра, Статистика.',
    categories: ['university']
  },
  {
    id: SubjectId.COMPUTER_SCIENCE,
    name: 'Компютърни Науки',
    icon: 'Terminal',
    color: 'bg-slate-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгоритми, Структури, ООП.',
    categories: ['university']
  },
  {
    id: SubjectId.ECONOMICS,
    name: 'Икономика',
    icon: 'TrendingUp',
    color: 'bg-emerald-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Макро, Микро, Финанси.',
    categories: ['university']
  },
  {
    id: SubjectId.FINANCE,
    name: 'Финанси',
    icon: 'Banknote',
    color: 'bg-emerald-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Банково дело, инвестиции.',
    categories: ['university']
  },
  {
    id: SubjectId.MANAGEMENT,
    name: 'Мениджмънт',
    icon: 'Briefcase',
    color: 'bg-blue-800',
    modes: [AppMode.LEARN, AppMode.TEACHER_PLAN],
    description: 'Управление на бизнес.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW,
    name: 'Право',
    icon: 'Scale',
    color: 'bg-amber-800',
    modes: [AppMode.LEARN],
    description: 'Гражданско, Наказателно, Търговско.',
    categories: ['university']
  },
  {
    id: SubjectId.MEDICINE,
    name: 'Медицина',
    icon: 'Stethoscope',
    color: 'bg-red-600',
    modes: [AppMode.LEARN],
    description: 'Анатомия, Патология, Фармация.',
    categories: ['university']
  },
  {
    id: SubjectId.DENTAL_MEDICINE,
    name: 'Дентална Медицина',
    icon: 'Smile',
    color: 'bg-cyan-500',
    modes: [AppMode.LEARN],
    description: 'Стоматология и хирургия.',
    categories: ['university']
  },
  {
    id: SubjectId.PHARMACY,
    name: 'Фармация',
    icon: 'Pill',
    color: 'bg-green-600',
    modes: [AppMode.LEARN],
    description: 'Лекарства и химия.',
    categories: ['university']
  },
  {
    id: SubjectId.VETERINARY_MEDICINE,
    name: 'Ветеринарна Медицина',
    icon: 'Heart',
    color: 'bg-green-700',
    modes: [AppMode.LEARN],
    description: 'Лечение на животни.',
    categories: ['university']
  },
  {
    id: SubjectId.ENGINEERING,
    name: 'Инженерство',
    icon: 'Wrench',
    color: 'bg-orange-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Механика, Електроника, Автоматизация.',
    categories: ['university']
  },
  {
    id: SubjectId.ARCHITECTURE,
    name: 'Архитектура',
    icon: 'Ruler',
    color: 'bg-stone-500',
    modes: [AppMode.DRAW, AppMode.LEARN],
    description: 'Сгради и дизайн.',
    categories: ['university']
  },
  {
    id: SubjectId.PSYCHOLOGY,
    name: 'Психология',
    icon: 'Brain',
    color: 'bg-purple-600',
    modes: [AppMode.LEARN],
    description: 'Когнитивна, Социална, Клинична.',
    categories: ['university']
  },
  {
    id: SubjectId.PEDAGOGY,
    name: 'Педагогика',
    icon: 'BookOpen',
    color: 'bg-rose-400',
    modes: [AppMode.LEARN, AppMode.TEACHER_PLAN],
    description: 'Методика на преподаване.',
    categories: ['university']
  },
  {
    id: SubjectId.MARKETING,
    name: 'Маркетинг',
    icon: 'Megaphone',
    color: 'bg-pink-600',
    modes: [AppMode.LEARN, AppMode.TEACHER_PLAN],
    description: 'Бизнес стратегии, Реклама, PR.',
    categories: ['university']
  },
  {
    id: SubjectId.JOURNALISM,
    name: 'Журналистика',
    icon: 'Newspaper',
    color: 'bg-zinc-600',
    modes: [AppMode.LEARN],
    description: 'Медии и комуникации.',
    categories: ['university']
  },
  {
    id: SubjectId.POLITICAL_SCIENCE,
    name: 'Политология',
    icon: 'Landmark',
    color: 'bg-purple-700',
    modes: [AppMode.LEARN],
    description: 'Политика и управление.',
    categories: ['university']
  },
  {
    id: SubjectId.INT_RELATIONS,
    name: 'Международни Отношения',
    icon: 'Globe',
    color: 'bg-sky-600',
    modes: [AppMode.LEARN],
    description: 'Дипломация и политика.',
    categories: ['university']
  },
  {
    id: SubjectId.SOCIOLOGY,
    name: 'Социология',
    icon: 'Users',
    color: 'bg-orange-600',
    modes: [AppMode.LEARN],
    description: 'Общество и процеси.',
    categories: ['university']
  },
  {
    id: SubjectId.STATISTICS,
    name: 'Статистика',
    icon: 'BarChart2',
    color: 'bg-cyan-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Вероятности, Анализ на данни.',
    categories: ['university']
  },
  {
    id: SubjectId.ECOLOGY,
    name: 'Екология',
    icon: 'Leaf',
    color: 'bg-lime-600',
    modes: [AppMode.LEARN],
    description: 'Опазване на средата.',
    categories: ['university']
  },
  {
    id: SubjectId.TOURISM,
    name: 'Туризъм',
    icon: 'Map',
    color: 'bg-orange-400',
    modes: [AppMode.LEARN],
    description: 'Хотелиерство и пътувания.',
    categories: ['university']
  }
];
