
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
    color: 'bg-yellow-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език и немска култура.',
    categories: ['school']
  },
  {
    id: SubjectId.FRENCH,
    name: 'Френски език',
    icon: 'Languages',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език и франкофония.',
    categories: ['school']
  },
  {
    id: SubjectId.SPANISH,
    name: 'Испански език',
    icon: 'Languages',
    color: 'bg-orange-500',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език и испаноезичен свят.',
    categories: ['school']
  },
  {
    id: SubjectId.RUSSIAN,
    name: 'Руски език',
    icon: 'Languages',
    color: 'bg-red-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език и руска литература.',
    categories: ['school']
  },
  {
    id: SubjectId.ITALIAN,
    name: 'Италиански език',
    icon: 'Languages',
    color: 'bg-emerald-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Чужд език и италианска култура.',
    categories: ['school']
  },
  {
    id: SubjectId.IT,
    name: 'ИТ и Информатика',
    icon: 'Cpu',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Информационни технологии и основи.',
    categories: ['school']
  },
  {
    id: SubjectId.PROGRAMMING,
    name: 'Програмиране и Моделиране',
    icon: 'Code',
    color: 'bg-indigo-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгоритми, Python, C++, Java.',
    categories: ['school']
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология и Здравно Образование',
    icon: 'Dna',
    color: 'bg-emerald-500',
    modes: [AppMode.LEARN],
    description: 'Жива природа, човек и здраве.',
    categories: ['school']
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия и ООС',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Химични елементи и опазване на средата.',
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
    id: SubjectId.HISTORY,
    name: 'История и Цивилизации',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.LEARN],
    description: 'Българска и световна история.',
    categories: ['school']
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География и Икономика',
    icon: 'Globe',
    color: 'bg-cyan-500',
    modes: [AppMode.LEARN],
    description: 'Региони, държави и икономика.',
    categories: ['school']
  },
  {
    id: SubjectId.CITIZENSHIP,
    name: 'Гражданско Образование',
    icon: 'Users',
    color: 'bg-indigo-400',
    modes: [AppMode.LEARN],
    description: 'Общество, права и социални науки.',
    categories: ['school']
  },
  {
    id: SubjectId.ART,
    name: 'Изобразително Изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.SOLVE, AppMode.PRESENTATION, AppMode.LEARN],
    description: 'Визуални изкуства и дизайн.',
    categories: ['school']
  },
  {
    id: SubjectId.MUSIC,
    name: 'Музика',
    icon: 'Music',
    color: 'bg-pink-400',
    modes: [AppMode.LEARN],
    description: 'Теория, история и култура.',
    categories: ['school']
  },
  {
    id: SubjectId.PE,
    name: 'Физкултура и Спорт',
    icon: 'Activity',
    color: 'bg-orange-500',
    modes: [AppMode.LEARN],
    description: 'Здравословен начин на живот.',
    categories: ['school']
  },
  {
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-400',
    modes: [AppMode.LEARN],
    description: 'Етика, логика и критично мислене.',
    categories: ['school']
  },
  {
    id: SubjectId.ENTREPRENEURSHIP,
    name: 'Предприемачество и Икономика',
    icon: 'TrendingUp',
    color: 'bg-teal-600',
    modes: [AppMode.LEARN, AppMode.SOLVE],
    description: 'Бизнес идеи и финансова грамотност.',
    categories: ['school']
  },
  {
    id: SubjectId.RELIGION,
    name: 'Религия',
    icon: 'Book',
    color: 'bg-amber-700',
    modes: [AppMode.LEARN],
    description: 'Вяра, морал и християнска етика.',
    categories: ['school']
  },
  {
    id: SubjectId.CHOREOGRAPHY,
    name: 'Хореография и Танц',
    icon: 'Activity',
    color: 'bg-rose-500',
    modes: [AppMode.LEARN],
    description: 'Народни и модерни танци.',
    categories: ['school']
  },
  
  // UNIVERSITY - Humanities & Social Sciences
  {
    id: SubjectId.UNI_PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Етика, онтология и логика.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_HISTORY,
    name: 'История',
    icon: 'Landmark',
    color: 'bg-amber-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Архиви, периоди и методология.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_SOCIOLOGY,
    name: 'Социология',
    icon: 'Users',
    color: 'bg-indigo-400',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Обществени структури и динамика.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_PSYCHOLOGY,
    name: 'Психология',
    icon: 'BrainCircuit',
    color: 'bg-pink-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Поведение и когнитивни процеси.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_POLITICAL_SCIENCE,
    name: 'Политология',
    icon: 'Gavel',
    color: 'bg-blue-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Власт, държава и системи.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_INT_RELATIONS,
    name: 'Международни Отношения',
    icon: 'Globe',
    color: 'bg-cyan-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Дипломация и глобална политика.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_CULTURAL_STUDIES,
    name: 'Културология',
    icon: 'Library',
    color: 'bg-rose-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Културна идентичност и медии.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_LINGUISTICS,
    name: 'Лингвистика',
    icon: 'Type',
    color: 'bg-slate-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Езикознание и структури.',
    categories: ['university']
  },
  {
    id: SubjectId.UNI_LITERATURE,
    name: 'Литература',
    icon: 'Book',
    color: 'bg-amber-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Литературен анализ и теория.',
    categories: ['university']
  },

  // UNIVERSITY - Law & Governance
  {
    id: SubjectId.LAW_CONSTITUTIONAL,
    name: 'Конституционно право',
    icon: 'Gavel',
    color: 'bg-zinc-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Основни закони и права.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_CIVIL,
    name: 'Гражданско право',
    icon: 'Scale',
    color: 'bg-zinc-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Облигации, собственост и договори.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_CRIMINAL,
    name: 'Наказателно право',
    icon: 'ShieldAlert',
    color: 'bg-red-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Престъпления и санкции.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_ADMINISTRATIVE,
    name: 'Административно право',
    icon: 'FileText',
    color: 'bg-blue-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Държавна администрация.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_INTERNATIONAL,
    name: 'Международно право',
    icon: 'Globe',
    color: 'bg-cyan-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Отношения между държави.',
    categories: ['university']
  },
  {
    id: SubjectId.LAW_EU,
    name: 'Право на ЕС',
    icon: 'Flag',
    color: 'bg-blue-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Институции и право на Евросъюза.',
    categories: ['university']
  },

  // UNIVERSITY - Economics & Business
  {
    id: SubjectId.ECON_MICRO,
    name: 'Микроикономика',
    icon: 'TrendingUp',
    color: 'bg-emerald-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Пазарно поведение и търсене.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_MACRO,
    name: 'Макроикономика',
    icon: 'PieChart',
    color: 'bg-emerald-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Инфлация, БВП и фискална политика.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_ACCOUNTING,
    name: 'Счетоводство',
    icon: 'Calculator',
    color: 'bg-slate-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Финансови отчети и контрол.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_FINANCE,
    name: 'Финанси',
    icon: 'Banknote',
    color: 'bg-green-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Инвестиции и банково дело.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_BIZ_ADMIN,
    name: 'Бизнес администрация',
    icon: 'Briefcase',
    color: 'bg-indigo-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Организация на компанията.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_MANAGEMENT,
    name: 'Мениджмънт',
    icon: 'Users2',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Управление на екипи и ресурси.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_MARKETING,
    name: 'Маркетинг',
    icon: 'Megaphone',
    color: 'bg-pink-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Реклама и пазарни проучвания.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_INT_BUSINESS,
    name: 'Международен бизнес',
    icon: 'Globe2',
    color: 'bg-sky-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Търговия на световни пазари.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_ENTREPRENEURSHIP,
    name: 'Предприемачество',
    icon: 'Rocket',
    color: 'bg-orange-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Стартиране и развитие на бизнес.',
    categories: ['university']
  },
  {
    id: SubjectId.ECON_STRATEGIC_MGMT,
    name: 'Стратегически мениджмънт',
    icon: 'Target',
    color: 'bg-violet-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Дългосрочно планиране.',
    categories: ['university']
  },

  // UNIVERSITY - STEM
  {
    id: SubjectId.STEM_MATH,
    name: 'Математика (Висша)',
    icon: 'Sigma',
    color: 'bg-blue-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Анализ, Алгебра, Статистика.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_PHYSICS,
    name: 'Физика',
    icon: 'Atom',
    color: 'bg-indigo-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Механика, Квантова физика.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CHEMISTRY,
    name: 'Химия',
    icon: 'FlaskConical',
    color: 'bg-green-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Органична и неорганична химия.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_BIOLOGY,
    name: 'Биология',
    icon: 'Dna',
    color: 'bg-emerald-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Генетика, Микробиология.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CS_PROG,
    name: 'Компютърни науки / Програмиране',
    icon: 'Terminal',
    color: 'bg-slate-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'ООП, Алгоритми и структури.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_INFO_SYSTEMS,
    name: 'Информационни системи',
    icon: 'Cpu',
    color: 'bg-slate-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Архитектура и мрежи.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_SW_ENGINEERING,
    name: 'Софтуерно инженерство',
    icon: 'Code2',
    color: 'bg-indigo-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Разработка и тестване.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_DSA,
    name: 'Структури от данни и Алгоритми',
    icon: 'Network',
    color: 'bg-blue-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Ефективност и оптимизация.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_DATABASES,
    name: 'Бази данни',
    icon: 'Database',
    color: 'bg-cyan-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'SQL, NoSQL и управление.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CYBERSECURITY,
    name: 'Киберсигурност',
    icon: 'ShieldLock',
    color: 'bg-red-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Защита на данни и мрежи.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_ELECTRICAL_ENG,
    name: 'Електроинженерство',
    icon: 'Zap',
    color: 'bg-yellow-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Вериги и енергетика.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_MECHANICAL_ENG,
    name: 'Машинно инженерство',
    icon: 'Wrench',
    color: 'bg-orange-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Термодинамика и статика.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_CIVIL_ENG,
    name: 'Строително инженерство',
    icon: 'Building',
    color: 'bg-stone-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Конструкции и хидравлика.',
    categories: ['university']
  },
  {
    id: SubjectId.STEM_ENV_ENGINEERING,
    name: 'Екологично инженерство',
    icon: 'Leaf',
    color: 'bg-lime-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Устойчиво развитие.',
    categories: ['university']
  },

  // UNIVERSITY - Medical & Health Sciences
  {
    id: SubjectId.MED_ANATOMY,
    name: 'Анатомия',
    icon: 'HeartPulse',
    color: 'bg-red-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Структура на човешкото тяло.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PHYSIOLOGY,
    name: 'Физиология',
    icon: 'Activity',
    color: 'bg-orange-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Функции на органите.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_BIOCHEMISTRY,
    name: 'Биохимия',
    icon: 'Microscope',
    color: 'bg-green-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Химични процеси в тялото.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PATHOLOGY,
    name: 'Патология',
    icon: 'Stethoscope',
    color: 'bg-purple-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Изследване на болести.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_SURGERY,
    name: 'Хирургия',
    icon: 'Scissors',
    color: 'bg-slate-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Оперативни методи.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_INTERNAL,
    name: 'Вътрешни болести',
    icon: 'ClipboardList',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Диагностика и терапия.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PEDIATRICS,
    name: 'Педиатрия',
    icon: 'Baby',
    color: 'bg-pink-400',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Грижа за децата.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PUBLIC_HEALTH,
    name: 'Обществено здраве',
    icon: 'Users',
    color: 'bg-emerald-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Епидемиология и хигиена.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_NURSING,
    name: 'Сестринство',
    icon: 'PlusCircle',
    color: 'bg-sky-400',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Медицински грижи.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_PHARMACY,
    name: 'Фармация',
    icon: 'Pill',
    color: 'bg-green-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Фармакология и лекарства.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_DENTAL,
    name: 'Дентална медицина',
    icon: 'Smile',
    color: 'bg-cyan-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Стоматология.',
    categories: ['university']
  },
  {
    id: SubjectId.MED_HEALTH_MGMT,
    name: 'Здравен мениджмънт',
    icon: 'Settings',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Управление на болници.',
    categories: ['university']
  },

  // UNIVERSITY - Arts & Design
  {
    id: SubjectId.ARTS_VISUAL,
    name: 'Визуални изкуства',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Рисуване и композиция.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_GRAPHIC_DESIGN,
    name: 'Графичен дизайн',
    icon: 'PenTool',
    color: 'bg-purple-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Визуална комуникация.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_MUSIC,
    name: 'Музика (Висша)',
    icon: 'Music',
    color: 'bg-indigo-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Композиция и етномузикология.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_PERFORMING,
    name: 'Сценични изкуства',
    icon: 'Mic2',
    color: 'bg-red-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Танц и хореография.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_THEATRE,
    name: 'Театрознание',
    icon: 'Drama',
    color: 'bg-rose-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'История и теория на театъра.',
    categories: ['university']
  },
  {
    id: SubjectId.ARTS_FILM_MEDIA,
    name: 'Филмови и медийни изкуства',
    icon: 'Film',
    color: 'bg-slate-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Режисура и монтаж.',
    categories: ['university']
  },

  // UNIVERSITY - Education
  {
    id: SubjectId.EDU_PEDAGOGY,
    name: 'Педагогика',
    icon: 'GraduationCap',
    color: 'bg-emerald-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Методика на обучение.',
    categories: ['university']
  },
  {
    id: SubjectId.EDU_CURRICULUM,
    name: 'Учебни програми и методи',
    icon: 'FileSpreadsheet',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Планиране на уроци.',
    categories: ['university']
  },
  {
    id: SubjectId.EDU_PSYCHOLOGY,
    name: 'Педагогическа психология',
    icon: 'Brain',
    color: 'bg-pink-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Развитие на обучаемия.',
    categories: ['university']
  },
  {
    id: SubjectId.EDU_SPECIAL,
    name: 'Специална педагогика',
    icon: 'Heart',
    color: 'bg-rose-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Инклузивно образование.',
    categories: ['university']
  },

  // UNIVERSITY - Other
  {
    id: SubjectId.OTHER_TOURISM,
    name: 'Туризъм и хотелиерство',
    icon: 'Hotel',
    color: 'bg-orange-400',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Мениджмънт на пътувания.',
    categories: ['university']
  },
  {
    id: SubjectId.OTHER_ENV_STUDIES,
    name: 'Екология (Environmental Studies)',
    icon: 'Leaf',
    color: 'bg-green-800',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Опазване на околната среда.',
    categories: ['university']
  },
  {
    id: SubjectId.OTHER_GEOGRAPHY,
    name: 'География и развитие',
    icon: 'Globe',
    color: 'bg-cyan-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Регионално планиране.',
    categories: ['university']
  },
  {
    id: SubjectId.OTHER_GEOLOGY,
    name: 'Геология',
    icon: 'Mountain',
    color: 'bg-stone-700',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Земни слоеве и минерали.',
    categories: ['university']
  },
  {
    id: SubjectId.OTHER_THEOLOGY,
    name: 'Теология',
    icon: 'BookOpen',
    color: 'bg-amber-900',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Религия и философия.',
    categories: ['university']
  },
  {
    id: SubjectId.OTHER_JOURNALISM,
    name: 'Журналистика и комуникации',
    icon: 'Newspaper',
    color: 'bg-zinc-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Медии и PR.',
    categories: ['university']
  }
];
