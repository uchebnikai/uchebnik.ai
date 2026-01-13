
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

  const baseInstructions = `Your name is Uchebnik AI. You are a world-class AI tutor and expert task solver. Your primary goal is to provide 100% correct, well-explained, and logically structured solutions to educational problems.

  IDENTITY AND CREATOR RULES:
  1. Your name is strictly "Uchebnik AI".
  2. If asked who created you, who your developers are, or who you are, you MUST answer that you were created and developed by Иван Йорданов and Светломир Иванов.
  3. When mentioning your creators, you MUST provide these links in Markdown: [Иван Йорданов](https://instagram.com/vanyoy) and [Светломир Иванов](https://instagram.com/s_ivanov6).
  4. NEVER say you are a large language model trained by Google.
  5. NEVER mention Google as your creator or developer.
  6. If a user asks about your origin, simply state you are Uchebnik AI, created by Иван Йорданов and Светломир Иванов to help students.

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
  
  // --- SCHOOL SUBJECTS (CORE) ---
  { id: SubjectId.BULGARIAN, name: 'Български език и Литература', icon: 'BookOpen', color: 'bg-red-500', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Граматика, литературен анализ и есета.', categories: ['school'] },
  { id: SubjectId.MATH, name: 'Математика', icon: 'Calculator', color: 'bg-blue-500', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Алгебра, геометрия и тригонометрия.', categories: ['school'] },
  { id: SubjectId.FOREIGN_LANG, name: 'Чужди езици', icon: 'Languages', color: 'bg-sky-500', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Английски, Немски, Френски и др.', categories: ['school'] },
  { id: SubjectId.IT_CS, name: 'ИТ и Информатика', icon: 'Cpu', color: 'bg-slate-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Компютърни науки и технологии.', categories: ['school'] },
  { id: SubjectId.BIOLOGY, name: 'Биология и ЗО', icon: 'Dna', color: 'bg-emerald-600', modes: [AppMode.LEARN], description: 'Жива природа и здраве на човека.', categories: ['school'] },
  { id: SubjectId.CHEMISTRY, name: 'Химия и ООС', icon: 'FlaskConical', color: 'bg-green-500', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Химични елементи и екология.', categories: ['school'] },
  { id: SubjectId.PHYSICS, name: 'Физика и Астрономия', icon: 'Atom', color: 'bg-violet-600', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Физични закони и космос.', categories: ['school'] },
  { id: SubjectId.HISTORY, name: 'История и Цивилизации', icon: 'Landmark', color: 'bg-amber-600', modes: [AppMode.LEARN], description: 'Исторически събития и анализи.', categories: ['school'] },
  { id: SubjectId.GEOGRAPHY, name: 'География и Икономика', icon: 'Globe', color: 'bg-cyan-600', modes: [AppMode.LEARN], description: 'Природна и стопанска география.', categories: ['school'] },
  { id: SubjectId.CIVIC_ED, name: 'Гражданско образование', icon: 'Users', color: 'bg-rose-500', modes: [AppMode.LEARN], description: 'Права, задължения и общество.', categories: ['school'] },
  { id: SubjectId.VISUAL_ARTS, name: 'Изобразително изкуство', icon: 'Palette', color: 'bg-pink-500', modes: [AppMode.LEARN], description: 'Живопис, графика и дизайн.', categories: ['school'] },
  { id: SubjectId.MUSIC, name: 'Музика', icon: 'Music', color: 'bg-purple-500', modes: [AppMode.LEARN], description: 'Теория и история на музиката.', categories: ['school'] },
  { id: SubjectId.PE, name: 'Физическо възпитание', icon: 'Dumbbell', color: 'bg-orange-500', modes: [AppMode.LEARN], description: 'Спорт и здравословен живот.', categories: ['school'] },
  { id: SubjectId.PHILOSOPHY, name: 'Философия', icon: 'Brain', color: 'bg-indigo-400', modes: [AppMode.LEARN], description: 'Етика, логика и мислене.', categories: ['school'] },
  { id: SubjectId.ENTREPRENEURSHIP, name: 'Предприемачество', icon: 'TrendingUp', color: 'bg-teal-600', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Бизнес идеи и икономика.', categories: ['school'] },

  // --- UNIVERSITY SUBJECTS (Core Academic Areas) ---
  
  // 1. Humanities & Social Sciences
  { id: SubjectId.UNI_PHILOSOPHY, name: 'Философия', icon: 'Brain', color: 'bg-indigo-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Етика, онтология и логика.', categories: ['university'] },
  { id: SubjectId.UNI_HISTORY, name: 'История', icon: 'Scroll', color: 'bg-amber-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'История на България и света.', categories: ['university'] },
  { id: SubjectId.UNI_SOCIOLOGY, name: 'Социология', icon: 'Users', color: 'bg-blue-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Обществени структури и процеси.', categories: ['university'] },
  { id: SubjectId.UNI_PSYCHOLOGY, name: 'Психология', icon: 'Brain', color: 'bg-purple-700', modes: [AppMode.LEARN, AppMode.SOLVE, AppMode.CHAT], description: 'Психология на личността и развитието.', categories: ['university'] },
  { id: SubjectId.UNI_POLITICAL_SCIENCE, name: 'Политология', icon: 'Landmark', color: 'bg-slate-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Политически системи и идеологии.', categories: ['university'] },
  { id: SubjectId.UNI_INT_RELATIONS, name: 'Международни отношения', icon: 'Globe', color: 'bg-sky-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Дипломация и глобална политика.', categories: ['university'] },
  { id: SubjectId.UNI_CULTURAL_STUDIES, name: 'Културология', icon: 'Palette', color: 'bg-pink-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Теория и история на културата.', categories: ['university'] },
  { id: SubjectId.UNI_LINGUISTICS, name: 'Лингвистика', icon: 'Languages', color: 'bg-indigo-500', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Структура и история на езиците.', categories: ['university'] },
  { id: SubjectId.UNI_LITERATURE, name: 'Литература', icon: 'BookOpen', color: 'bg-red-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Литературна теория и анализ.', categories: ['university'] },
  { id: SubjectId.UNI_LANG_COURSES, name: 'Езикови курсове (C1/C2)', icon: 'Languages', color: 'bg-sky-600', modes: [AppMode.CHAT, AppMode.LEARN], description: 'Високо ниво на чужд език.', categories: ['university'] },

  // 2. Law & Governance
  { id: SubjectId.UNI_LAW_CONSTITUTIONAL, name: 'Конституционно право', icon: 'Scale', color: 'bg-slate-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Основни закони и държавно устройство.', categories: ['university'] },
  { id: SubjectId.UNI_LAW_CIVIL, name: 'Гражданско право', icon: 'Scale', color: 'bg-slate-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Облигационно и вещно право.', categories: ['university'] },
  { id: SubjectId.UNI_LAW_CRIMINAL, name: 'Наказателно право', icon: 'Shield', color: 'bg-red-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Престъпления и наказания.', categories: ['university'] },
  { id: SubjectId.UNI_LAW_ADMINISTRATIVE, name: 'Административно право', icon: 'FileText', color: 'bg-zinc-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Държавна администрация и контрол.', categories: ['university'] },
  { id: SubjectId.UNI_LAW_INTERNATIONAL, name: 'Международно право', icon: 'Globe', color: 'bg-indigo-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Публично международно право.', categories: ['university'] },
  { id: SubjectId.UNI_LAW_EU, name: 'Право на ЕС', icon: 'Landmark', color: 'bg-blue-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Институции и право на Евросъюза.', categories: ['university'] },

  // 3. Economics & Business
  { id: SubjectId.UNI_ECON_MICRO, name: 'Микроикономика', icon: 'TrendingUp', color: 'bg-emerald-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Пазари, търсене и предлагане.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_MACRO, name: 'Макроикономика', icon: 'TrendingUp', color: 'bg-emerald-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'БВП, инфлация и растеж.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_ACCOUNTING, name: 'Счетоводство', icon: 'FileText', color: 'bg-zinc-600', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Финансово и управленско счетоводство.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_FINANCE, name: 'Финанси', icon: 'Wallet', color: 'bg-emerald-900', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Корпоративни и публични финанси.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_BIZ_ADMIN, name: 'Бизнес администрация', icon: 'Briefcase', color: 'bg-blue-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Управление на бизнес организации.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_MANAGEMENT, name: 'Мениджмънт', icon: 'Briefcase', color: 'bg-indigo-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Лидерство и организационно развитие.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_MARKETING, name: 'Маркетинг', icon: 'Zap', color: 'bg-orange-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Стратегии и пазарни проучвания.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_INT_BUSINESS, name: 'Международен бизнес', icon: 'Globe', color: 'bg-teal-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Глобални пазари и търговия.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_ENTREPRENEURSHIP, name: 'Предприемачество', icon: 'TrendingUp', color: 'bg-amber-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Стартиране и мащабиране на бизнес.', categories: ['university'] },
  { id: SubjectId.UNI_ECON_STRATEGIC_MGMT, name: 'Стратегически мениджмънт', icon: 'Target', color: 'bg-slate-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Планиране и конкурентни предимства.', categories: ['university'] },

  // 4. STEM
  { id: SubjectId.UNI_STEM_MATH, name: 'Висша Математика', icon: 'Calculator', color: 'bg-blue-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Анализ, алгебра и диференциални уравнения.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_PHYSICS, name: 'Физика (Висша)', icon: 'Atom', color: 'bg-violet-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Механика, оптика, квантова физика.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_CHEMISTRY, name: 'Химия (Висша)', icon: 'FlaskConical', color: 'bg-green-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Органична, неорганична и аналитична.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_BIOLOGY, name: 'Биология (Висша)', icon: 'Dna', color: 'bg-emerald-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Молекулярна биология и генетика.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_CS_PROG, name: 'Компютърни науки / Прогр.', icon: 'Code', color: 'bg-zinc-900', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Алгоритми и езици за програмиране.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_INFO_SYSTEMS, name: 'Информационни системи', icon: 'Database', color: 'bg-slate-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'ИТ инфраструктура и управление.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_SW_ENGINEERING, name: 'Софтуерно инженерство', icon: 'Cpu', color: 'bg-zinc-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Процеси и дизайн на софтуер.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_DSA, name: 'Алгоритми и структури', icon: 'Binary', color: 'bg-indigo-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Оптимизация и сложност.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_DATABASES, name: 'Бази данни', icon: 'HardDrive', color: 'bg-blue-900', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'SQL, NoSQL и дизайн.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_CYBERSECURITY, name: 'Киберсигурност', icon: 'ShieldCheck', color: 'bg-red-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Мрежова защита и криптография.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_ELECTRICAL_ENG, name: 'Електроинженерство', icon: 'Zap', color: 'bg-amber-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Схеми, сигнали и системи.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_MECHANICAL_ENG, name: 'Машинно инженерство', icon: 'Cpu', color: 'bg-gray-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Термодинамика и механика.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_CIVIL_ENG, name: 'Строително инженерство', icon: 'Landmark', color: 'bg-orange-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Конструкции и архитектура.', categories: ['university'] },
  { id: SubjectId.UNI_STEM_ENV_ENGINEERING, name: 'Еко инженерство', icon: 'Leaf', color: 'bg-green-900', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Възобновяеми източници и пречистване.', categories: ['university'] },

  // 5. Medical & Health Sciences
  { id: SubjectId.UNI_MED_ANATOMY, name: 'Анатомия', icon: 'Activity', color: 'bg-red-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Структура на човешкото тяло.', categories: ['university'] },
  { id: SubjectId.UNI_MED_PHYSIOLOGY, name: 'Физиология', icon: 'Activity', color: 'bg-rose-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Функции на органите и системите.', categories: ['university'] },
  { id: SubjectId.UNI_MED_BIOCHEMISTRY, name: 'Биохимия', icon: 'FlaskConical', color: 'bg-emerald-600', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Химични процеси в живите клетки.', categories: ['university'] },
  { id: SubjectId.UNI_MED_PATHOLOGY, name: 'Патология', icon: 'AlertCircle', color: 'bg-orange-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Промени в клетките при болест.', categories: ['university'] },
  { id: SubjectId.UNI_MED_SURGERY, name: 'Хирургия', icon: 'Activity', color: 'bg-blue-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Оперативни методи за лечение.', categories: ['university'] },
  { id: SubjectId.UNI_MED_INTERNAL, name: 'Вътрешни болести', icon: 'Heart', color: 'bg-red-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Диагностика и неоперативно лечение.', categories: ['university'] },
  { id: SubjectId.UNI_MED_PEDIATRICS, name: 'Педиатрия', icon: 'Users', color: 'bg-sky-500', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Лечение и грижа за деца.', categories: ['university'] },
  { id: SubjectId.UNI_MED_PUBLIC_HEALTH, name: 'Обществено здраве', icon: 'Globe', color: 'bg-teal-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Превенция и здравна политика.', categories: ['university'] },
  { id: SubjectId.UNI_MED_NURSING, name: 'Сестринство', icon: 'Activity', color: 'bg-white', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Здравни грижи и асистенция.', categories: ['university'] },
  { id: SubjectId.UNI_MED_PHARMACY, name: 'Фармация', icon: 'Pill', color: 'bg-emerald-500', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Лекарства и фармакология.', categories: ['university'] },
  { id: SubjectId.UNI_MED_DENTAL, name: 'Дентална медицина', icon: 'Sparkles', color: 'bg-cyan-500', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Орално здраве и стоматология.', categories: ['university'] },

  // 6. Arts & Design
  { id: SubjectId.UNI_ARTS_VISUAL, name: 'Визуални изкуства', icon: 'Palette', color: 'bg-pink-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Живопис, скулптура и медии.', categories: ['university'] },
  { id: SubjectId.UNI_ARTS_GRAPHIC_DESIGN, name: 'Графичен дизайн', icon: 'Layout', color: 'bg-purple-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Визуална комуникация и UI/UX.', categories: ['university'] },
  { id: SubjectId.UNI_ARTS_MUSIC, name: 'Музика (Висша)', icon: 'Music', color: 'bg-purple-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Музикална теория и изпълнение.', categories: ['university'] },
  { id: SubjectId.UNI_ARTS_PERFORMING, name: 'Сценични изкуства', icon: 'Mic', color: 'bg-red-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Танц, актьорство и вокал.', categories: ['university'] },
  { id: SubjectId.UNI_ARTS_THEATRE, name: 'Театрознание', icon: 'Users', color: 'bg-amber-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'История и теория на театъра.', categories: ['university'] },
  { id: SubjectId.UNI_ARTS_FILM_MEDIA, name: 'Филмови и медийни изкуства', icon: 'Film', color: 'bg-black', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Кино, видеопродукция и нови медии.', categories: ['university'] },

  // 7. Education
  { id: SubjectId.UNI_EDU_PEDAGOGY, name: 'Педагогика', icon: 'GraduationCap', color: 'bg-indigo-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Теория и практика на обучението.', categories: ['university'] },
  { id: SubjectId.UNI_EDU_CURRICULUM, name: 'Учебни програми', icon: 'FileText', color: 'bg-zinc-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Методика на преподаване.', categories: ['university'] },
  { id: SubjectId.UNI_EDU_PSYCHOLOGY, name: 'Пед. психология', icon: 'Brain', color: 'bg-purple-600', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Учене и детско развитие.', categories: ['university'] },
  { id: SubjectId.UNI_EDU_SPECIAL, name: 'Специална педагогика', icon: 'Heart', color: 'bg-pink-500', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Обучение на деца със СОП.', categories: ['university'] },

  // 8. Other Fields
  { id: SubjectId.UNI_OTHER_TOURISM, name: 'Туризъм и хотелиерство', icon: 'MapPin', color: 'bg-sky-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Управление на туристически обекти.', categories: ['university'] },
  { id: SubjectId.UNI_OTHER_ENV_STUDIES, name: 'Екология (Висша)', icon: 'Leaf', color: 'bg-emerald-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Опазване на ресурсите и околната среда.', categories: ['university'] },
  { id: SubjectId.UNI_OTHER_GEOGRAPHY, name: 'География (Висша)', icon: 'Globe', color: 'bg-cyan-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Регионално развитие и картография.', categories: ['university'] },
  { id: SubjectId.UNI_OTHER_GEOLOGY, name: 'Геология', icon: 'Mountain', color: 'bg-amber-900', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Земна кора и минерални ресурси.', categories: ['university'] },
  { id: SubjectId.UNI_OTHER_THEOLOGY, name: 'Теология', icon: 'Church', color: 'bg-stone-700', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Религиозни учения и история.', categories: ['university'] },
  { id: SubjectId.UNI_OTHER_JOURNALISM, name: 'Журналистика', icon: 'FileText', color: 'bg-zinc-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Медийна комуникация и ПР.', categories: ['university'] },
  { id: SubjectId.UNI_MED_HEALTH_MGMT, name: 'Здравен мениджмънт', icon: 'Briefcase', color: 'bg-teal-800', modes: [AppMode.LEARN, AppMode.SOLVE], description: 'Управление на здравни заведения.', categories: ['university'] }
];
