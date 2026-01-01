
import { SubjectId, AppMode, SubjectConfig, TeachingStyle } from './types';
import { Language } from './utils/translations';

export const STRIPE_PRICES = {
  FREE: 'price_1SfPSOE0C0vexh9CQmjhJYYX',
  PLUS: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  PRO: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Standard AI', description: 'Бърз, ефективен и икономичен.' },
  { id: 'gemini-3-flash-preview', name: 'Advanced AI', description: 'Висок интелект, оптимизирана цена.' }
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

  const baseInstructions = `You are a world-class AI tutor and expert task solver. Your primary goal is to provide 100% correct, well-explained, and logically structured solutions to educational problems.
  ${personalityInstruction}
  IMPORTANT: You MUST reply in ${targetLang} language.`;

  const latexInstructions = `
  IMPORTANT FOR MATH/PHYSICS:
  Always use LaTeX formatting for all mathematical formulas and symbols.
  - Enclose inline formulas with $. Example: "The solution is $x = 5$."
  - Enclose block formulas with $$. Example: "$$\\sqrt{a^2 + b^2}$$".
  - Never write "sqrt", "alpha" as plain text, use $\\sqrt{...}$, $\\alpha$.`;

  const svInstructions = `
  IF A DRAWING/GEOMETRY IS NEEDED:
  Generate SVG code in a JSON block.
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
  Return a SINGLE complete index.html code block with embedded CSS/JS for instant preview.
  `;

  switch(mode) {
    case 'LEARN':
      return `${baseInstructions}
      You are a teacher. Your goal is to teach the user about a topic. Do not just give answers, explain concepts. Use examples and analogies. Structure information logically.
      ${latexInstructions}
      ${codingInstructions}`;
    
    case 'SOLVE':
      return `${baseInstructions}
      You are an expert problem solver. 
      STEPS FOR ACCURACY:
      1. Carefully analyze every constraint in the problem.
      2. Plan the solution step-by-step.
      3. CRITICAL: Perform a "Verification Check" at the end. Substitute values back or use an alternative method to double-check the result.
      4. Only then, provide the final answer clearly.
      ${latexInstructions}
      ${svInstructions}
      ${codingInstructions}`;

    case 'PRESENTATION':
      return `${baseInstructions}
      Create a presentation plan. Structure it in slides. For each slide give a title, content (bullets), and speaker notes. Return the response ONLY in JSON format array of slides.`;

    case 'TEACHER_TEST':
      return `${baseInstructions}
      You are a teacher's assistant. Create a test.
      Return the result in STRICT JSON format matching the schema defined for TestData.
      Do not use Markdown outside the JSON.
      `;

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
  
  // CORE SUBJECTS
  {
    id: SubjectId.BULGARIAN,
    name: 'Български език и Литература',
    icon: 'BookOpen',
    color: 'bg-red-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Граматика, литературен анализ и есета.',
    categories: ['school']
  },
  {
    id: SubjectId.MATH,
    name: 'Математика',
    icon: 'Calculator',
    color: 'bg-blue-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгебра, геометрия и тригонометрия.',
    categories: ['school']
  },
  {
    id: SubjectId.FOREIGN_LANG,
    name: 'Чужди езици',
    icon: 'Languages',
    color: 'bg-sky-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Английски, Немски, Френски и др.',
    categories: ['school']
  },
  {
    id: SubjectId.IT_CS,
    name: 'ИТ и Информатика',
    icon: 'Cpu',
    color: 'bg-slate-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Компютърни науки и технологии.',
    categories: ['school']
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология и ЗО',
    icon: 'Dna',
    color: 'bg-emerald-600',
    modes: [AppMode.LEARN],
    description: 'Жива природа и здраве на човека.',
    categories: ['school']
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия и ООС',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Химични елементи и екология.',
    categories: ['school']
  },
  {
    id: SubjectId.PHYSICS,
    name: 'Физика и Астрономия',
    icon: 'Atom',
    color: 'bg-violet-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Физични закони и космос.',
    categories: ['school']
  },
  {
    id: SubjectId.HISTORY,
    name: 'История и Цивилизации',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.LEARN],
    description: 'Исторически събития и анализи.',
    categories: ['school']
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География и Икономика',
    icon: 'Globe',
    color: 'bg-cyan-600',
    modes: [AppMode.LEARN],
    description: 'Природна и стопанска география.',
    categories: ['school']
  },
  {
    id: SubjectId.CIVIC_ED,
    name: 'Гражданско образование',
    icon: 'Users',
    color: 'bg-rose-500',
    modes: [AppMode.LEARN],
    description: 'Права, задължения и общество.',
    categories: ['school']
  },
  {
    id: SubjectId.VISUAL_ARTS,
    name: 'Изобразително изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.LEARN],
    description: 'Живопис, графика и дизайн.',
    categories: ['school']
  },
  {
    id: SubjectId.MUSIC,
    name: 'Музика',
    icon: 'Music',
    color: 'bg-purple-500',
    modes: [AppMode.LEARN],
    description: 'Теория и история на музиката.',
    categories: ['school']
  },
  {
    id: SubjectId.PE,
    name: 'Физическо възпитание',
    icon: 'Dumbbell',
    color: 'bg-orange-500',
    modes: [AppMode.LEARN],
    description: 'Спорт и здравословен живот.',
    categories: ['school']
  },
  {
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-indigo-400',
    modes: [AppMode.LEARN],
    description: 'Етика, логика и мислене.',
    categories: ['school']
  },
  {
    id: SubjectId.ENTREPRENEURSHIP,
    name: 'Предприемачество',
    icon: 'TrendingUp',
    color: 'bg-teal-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Бизнес идеи и икономика.',
    categories: ['school']
  },

  // OPTIONAL / SPECIALIZED
  {
    id: SubjectId.PROG_MODELING,
    name: 'Програмиране',
    icon: 'Code',
    color: 'bg-zinc-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Компютърно моделиране и код.',
    categories: ['school']
  },
  {
    id: SubjectId.ECOLOGY,
    name: 'Екология',
    icon: 'Leaf',
    color: 'bg-green-700',
    modes: [AppMode.LEARN],
    description: 'Опазване на околната среда.',
    categories: ['school']
  },
  {
    id: SubjectId.PERSONAL_FINANCE,
    name: 'Лични финанси',
    icon: 'Wallet',
    color: 'bg-emerald-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Управление на пари и бюджет.',
    categories: ['school']
  },
  {
    id: SubjectId.RELIGION,
    name: 'Религия',
    icon: 'Church',
    color: 'bg-stone-500',
    modes: [AppMode.LEARN],
    description: 'Световни религии и етика.',
    categories: ['school']
  },

  // PROFILES
  {
    id: SubjectId.PROFILE_STEM,
    name: 'Профил STEM',
    icon: 'Microscope',
    color: 'bg-blue-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Математика, Физика, Информатика.',
    categories: ['school', 'profile']
  },
  {
    id: SubjectId.PROFILE_HUMANITIES,
    name: 'Профил Хуманитарен',
    icon: 'Scroll',
    color: 'bg-red-700',
    modes: [AppMode.LEARN],
    description: 'Български, История, Езици.',
    categories: ['school', 'profile']
  },
  {
    id: SubjectId.PROFILE_SOCIAL_ECON,
    name: 'Профил Общ. науки',
    icon: 'Briefcase',
    color: 'bg-amber-700',
    modes: [AppMode.LEARN],
    description: 'География, Предприемачество.',
    categories: ['school', 'profile']
  }
];
