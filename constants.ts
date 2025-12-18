
import { SubjectId, AppMode, SubjectConfig } from './types';
import { Language } from './utils/translations';

export const STRIPE_PRICES = {
  FREE: 'price_1SfPSOE0C0vexh9CQmjhJYYX',
  PLUS: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  PRO: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Най-бързият и мощен модел на Google.' }
];

export const getSystemPrompt = (mode: string, lang: Language): string => {
  const languageNames: Record<Language, string> = {
    bg: 'Bulgarian',
    en: 'English',
    de: 'German',
    es: 'Spanish',
    tr: 'Turkish'
  };
  const targetLang = languageNames[lang];

  const baseInstructions = `You are a helpful AI assistant for students and teachers. Help with lessons, solve problems, and answer questions. Always be polite and encouraging. 
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

  switch(mode) {
    case 'LEARN':
      return `${baseInstructions}
      You are a teacher. Your goal is to teach the user about a topic. Do not just give answers, explain concepts. Use examples and analogies. Structure information logically.
      ${latexInstructions}`;
    
    case 'SOLVE':
      return `${baseInstructions}
      You are an expert problem solver. Solve step-by-step. Explain every step clearly.
      ${latexInstructions}
      ${svInstructions}`;

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
      return `${baseInstructions} ${latexInstructions}`;
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
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-400',
    modes: [AppMode.LEARN],
    description: 'Логика и етика.',
    categories: ['school', 'university']
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
    id: SubjectId.ENGINEERING,
    name: 'Инженерство',
    icon: 'Wrench',
    color: 'bg-orange-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Механика, Електроника, Автоматизация.',
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
    id: SubjectId.MARKETING,
    name: 'Маркетинг',
    icon: 'Megaphone',
    color: 'bg-pink-600',
    modes: [AppMode.LEARN, AppMode.TEACHER_PLAN],
    description: 'Бизнес стратегии, Реклама, PR.',
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
  }
];
