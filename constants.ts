
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
  
  // SCHOOL SUBJECTS
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
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгебра, геометрия и тригонометрия.',
    categories: ['school']
  },
  {
    id: SubjectId.ENGLISH,
    name: 'Английски език',
    icon: 'Languages',
    color: 'bg-blue-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език - нива A1 до C2.',
    categories: ['school']
  },
  {
    id: SubjectId.GERMAN,
    name: 'Немски език',
    icon: 'Languages',
    color: 'bg-orange-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Немски език и култура.',
    categories: ['school']
  },
  {
    id: SubjectId.FRENCH,
    name: 'Френски език',
    icon: 'Languages',
    color: 'bg-indigo-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Френски език и граматика.',
    categories: ['school']
  },
  {
    id: SubjectId.SPANISH,
    name: 'Испански език',
    icon: 'Languages',
    color: 'bg-yellow-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Испански език и литература.',
    categories: ['school']
  },
  {
    id: SubjectId.RUSSIAN,
    name: 'Руски език',
    icon: 'Languages',
    color: 'bg-cyan-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Руски език и произношение.',
    categories: ['school']
  },
  {
    id: SubjectId.ITALIAN,
    name: 'Италиански език',
    icon: 'Languages',
    color: 'bg-emerald-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Италиански език.',
    categories: ['school']
  },
  {
    id: SubjectId.PHYSICS,
    name: 'Физика и Астрономия',
    icon: 'Atom',
    color: 'bg-violet-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Природни закони и Космос.',
    categories: ['school']
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия и ООС',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Химични елементи и реакции.',
    categories: ['school']
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология и ЗО',
    icon: 'Dna',
    color: 'bg-emerald-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Жива природа и човек.',
    categories: ['school']
  },
  {
    id: SubjectId.HISTORY,
    name: 'История и Цивилизации',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Българска и световна история.',
    categories: ['school']
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География и Икономика',
    icon: 'Globe',
    color: 'bg-cyan-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Региони и стопанство.',
    categories: ['school']
  },
  {
    id: SubjectId.IT,
    name: 'Информационни Технологии',
    icon: 'Monitor',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Работа с данни и софтуер.',
    categories: ['school']
  },
  {
    id: SubjectId.PROGRAMMING,
    name: 'Програмиране',
    icon: 'Code',
    color: 'bg-zinc-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Кодене, алгоритми и разработка.',
    categories: ['school']
  },
  {
    id: SubjectId.CITIZENSHIP,
    name: 'Гражданско Образование',
    icon: 'Users',
    color: 'bg-blue-400',
    modes: [AppMode.LEARN],
    description: 'Общество, права и задължения.',
    categories: ['school']
  },
  {
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-400',
    modes: [AppMode.LEARN],
    description: 'Логика, етика и мислене.',
    categories: ['school']
  },
  {
    id: SubjectId.ENTREPRENEURSHIP,
    name: 'Предприемачество',
    icon: 'Zap',
    color: 'bg-orange-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Бизнес идеи и иновации.',
    categories: ['school']
  },
  {
    id: SubjectId.FINANCE_LITERACY,
    name: 'Финансова Грамотност',
    icon: 'Banknote',
    color: 'bg-emerald-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Лични финанси и бюджетиране.',
    categories: ['school']
  },
  {
    id: SubjectId.RELIGION,
    name: 'Религия',
    icon: 'Church',
    color: 'bg-stone-500',
    modes: [AppMode.LEARN],
    description: 'Религиозна култура и етика.',
    categories: ['school']
  },
  {
    id: SubjectId.ART,
    name: 'Изобразително Изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.LEARN],
    description: 'История на изкуството и техники.',
    categories: ['school']
  },
  {
    id: SubjectId.MUSIC,
    name: 'Музика',
    icon: 'Music',
    color: 'bg-violet-600',
    modes: [AppMode.LEARN],
    description: 'Теория и история на музиката.',
    categories: ['school']
  },
  {
    id: SubjectId.ECOLOGY,
    name: 'Екология',
    icon: 'Trees',
    color: 'bg-green-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Опазване на околната среда.',
    categories: ['school']
  },

  // UNIVERSITY SUBJECTS - Humanities
  {
    id: SubjectId.UNI_PHILOSOPHY,
    name: 'Философия (Акад.)',
    icon: 'Brain',
    color: 'bg-purple-700',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Академична философия.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_HISTORY,
    name: 'История (Акад.)',
    icon: 'Landmark',
    color: 'bg-amber-800',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Исторически изследвания.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_SOCIOLOGY,
    name: 'Социология',
    icon: 'Users',
    color: 'bg-indigo-700',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Обществени процеси.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_PSYCHOLOGY,
    name: 'Психология',
    icon: 'Activity',
    color: 'bg-pink-600',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Човешка психика.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_POLITICAL_SCIENCE,
    name: 'Политология',
    icon: 'Gavel',
    color: 'bg-slate-700',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Политически системи.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_INT_RELATIONS,
    name: 'Международни Отношения',
    icon: 'Globe',
    color: 'bg-blue-800',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Глобална политика.',
    categories: ['university']
  },

  // UNIVERSITY - Law
  {
    id: SubjectId.LAW_CIVIL,
    name: 'Гражданско Право',
    icon: 'Scale',
    color: 'bg-stone-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Гражданско-правни отношения.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_CRIMINAL,
    name: 'Наказателно Право',
    icon: 'Scale',
    color: 'bg-red-900',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Наказателен кодекс и процес.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_EU,
    name: 'Право на ЕС',
    icon: 'Flag',
    color: 'bg-blue-900',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Европейско законодателство.',
    categories: ['university']
  },

  // UNIVERSITY - Economics
  {
    id: SubjectId.ECON_MICRO,
    name: 'Микроикономика',
    icon: 'TrendingUp',
    color: 'bg-emerald-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Икономика на фирмата.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_FINANCE,
    name: 'Корпоративни Финанси',
    icon: 'Banknote',
    color: 'bg-green-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Управление на капитала.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_MARKETING,
    name: 'Маркетинг',
    icon: 'Target',
    color: 'bg-orange-600',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Пазарни проучвания и реклама.',
    categories: ['university']
  },

  // UNIVERSITY - STEM
  {
    id: SubjectId.STEM_MATH,
    name: 'Висша Математика',
    icon: 'Calculator',
    color: 'bg-blue-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Анализ, линейна алгебра и вероятности.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CS_PROG,
    name: 'Компютърни Науки',
    icon: 'Cpu',
    color: 'bg-gray-900',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Софтуерна разработка.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_SW_ENGINEERING,
    name: 'Софтуерно Инженерство',
    icon: 'Layers',
    color: 'bg-indigo-900',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Архитектура на софтуера.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CYBERSECURITY,
    name: 'Киберсигурност',
    icon: 'Shield',
    color: 'bg-red-700',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Мрежова сигурност и криптография.',
    categories: ['university']
  },

  // UNIVERSITY - Medical
  {
    id: SubjectId.MED_ANATOMY,
    name: 'Анатомия',
    icon: 'Activity',
    color: 'bg-red-600',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Структура на човешкото тяло.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PHARMACY,
    name: 'Фармация',
    icon: 'FlaskConical',
    color: 'bg-teal-600',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Лекарства и фармакология.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_DENTAL,
    name: 'Дентална Медицина',
    icon: 'Stethoscope',
    color: 'bg-sky-500',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Стоматология.',
    categories: ['university']
  },

  // UNIVERSITY - Arts
  {
    id: SubjectId.ARTS_GRAPHIC_DESIGN,
    name: 'Графичен Дизайн',
    icon: 'PenTool',
    color: 'bg-purple-600',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Визуална комуникация.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_FILM_MEDIA,
    name: 'Кино и Медии',
    icon: 'Film',
    color: 'bg-black',
    modes: [AppMode.LEARN, AppMode.CHAT],
    description: 'Филмово изкуство.',
    categories: ['university']
  }
];
