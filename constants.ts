
import { SubjectId, AppMode, SubjectConfig, TeachingStyle, QuickAction } from './types';
import { Language } from './utils/translations';

export const STRIPE_PRICES = {
  FREE: 'price_1SfPSOE0C0vexh9CQmjhJYYX',
  PLUS: 'price_1SfPSpE0C0vexh9Cg2YUGPah',
  PRO: 'price_1SfPTEE0C0vexh9C9RZMvkHB'
};

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Най-бързият и мощен модел на Google.' }
];

export const getSystemPrompt = (mode: string, lang: Language, teachingStyle: TeachingStyle = 'normal'): string => {
  const languageNames: Record<Language, string> = {
    bg: 'Bulgarian',
    en: 'English',
    de: 'German',
    es: 'Spanish',
    tr: 'Turkish',
    fr: 'French',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese (Simplified)',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    nl: 'Dutch',
    pl: 'Polish',
    ro: 'Romanian',
    el: 'Greek',
    uk: 'Ukrainian',
    cs: 'Czech',
    sv: 'Swedish',
    hu: 'Hungarian',
    vi: 'Vietnamese'
  };
  const targetLang = languageNames[lang] || 'English';

  let personalityInstruction = "";
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

// Helper to generate generic quick actions
const commonActions: QuickAction[] = [
    { id: 'summarize', label: 'Summarize', prompt: 'Summarize this topic simply.', icon: 'FileText' },
    { id: 'quiz', label: 'Quiz Me', prompt: 'Give me a short quiz on this.', icon: 'HelpCircle' },
    { id: 'explain', label: 'Explain', prompt: 'Explain this concept in detail.', icon: 'BookOpen' }
];

export const SUBJECTS: SubjectConfig[] = [
  {
    id: SubjectId.GENERAL,
    name: 'Общ Чат',
    icon: 'MessageSquare',
    color: 'bg-indigo-500',
    modes: [AppMode.CHAT],
    description: 'Попитай ме каквото и да е.',
    categories: ['school', 'university'],
    quickActions: [...commonActions, { id: 'joke', label: 'Tell a Joke', prompt: 'Tell me a joke.', icon: 'Smile' }]
  },
  {
    id: SubjectId.MATH,
    name: 'Математика',
    icon: 'Calculator',
    color: 'bg-blue-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгебра, геометрия и задачи.',
    categories: ['school'],
    quickActions: [
        { id: 'solve_quad', label: 'Квадратно У-ние', prompt: 'Solve the quadratic equation step-by-step.', icon: 'Calculator' },
        { id: 'derivative', label: 'Производна', prompt: 'Find the derivative of this function.', icon: 'TrendingUp' },
        { id: 'integral', label: 'Интеграл', prompt: 'Calculate the integral.', icon: 'Sigma' },
        { id: 'geometry', label: 'Геометрия', prompt: 'Solve this geometry problem and draw it.', icon: 'Triangle' },
        { id: 'pythagoras', label: 'Питагор', prompt: 'Explain the Pythagorean theorem.', icon: 'Triangle' },
        { id: 'fraction', label: 'Дроби', prompt: 'Help with fractions.', icon: 'PieChart' }
    ]
  },
  {
    id: SubjectId.BULGARIAN,
    name: 'Български език',
    icon: 'BookOpen',
    color: 'bg-red-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Граматика и литература.',
    categories: ['school'],
    quickActions: [
        { id: 'essay', label: 'Есе', prompt: 'Write an essay structure on the topic.', icon: 'FileText' },
        { id: 'grammar', label: 'Граматика', prompt: 'Check the grammar of this text.', icon: 'CheckCircle' },
        { id: 'analysis', label: 'Анализ', prompt: 'Analyze this literary work.', icon: 'Search' },
        { id: 'summary', label: 'Резюме', prompt: 'Summarize this text.', icon: 'Minimize2' }
    ]
  },
  {
    id: SubjectId.ENGLISH,
    name: 'Английски език',
    icon: 'Languages',
    color: 'bg-blue-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Превод и упражнения.',
    categories: ['school', 'university'],
    quickActions: [
        { id: 'translate', label: 'Translate', prompt: 'Translate this to Bulgarian.', icon: 'Languages' },
        { id: 'tenses', label: 'Tenses', prompt: 'Explain the verb tenses.', icon: 'Clock' },
        { id: 'conversation', label: 'Conversation', prompt: 'Let\'s practice a conversation.', icon: 'MessageCircle' },
        { id: 'vocab', label: 'Vocabulary', prompt: 'Give me 10 useful words on this topic.', icon: 'List' }
    ]
  },
  {
    id: SubjectId.PHYSICS,
    name: 'Физика',
    icon: 'Atom',
    color: 'bg-violet-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Закони и формули.',
    categories: ['school'],
    quickActions: [
        { id: 'newton', label: 'Закони на Нютон', prompt: 'Explain Newton\'s laws.', icon: 'Apple' },
        { id: 'kinematics', label: 'Кинематика', prompt: 'Solve this kinematics problem.', icon: 'Move' },
        { id: 'electricity', label: 'Електричество', prompt: 'Explain this circuit.', icon: 'Zap' },
        { id: 'formulas', label: 'Формули', prompt: 'List key formulas for this topic.', icon: 'List' }
    ]
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Реакции и елементи.',
    categories: ['school', 'university'],
    quickActions: [
        { id: 'balance', label: 'Изравняване', prompt: 'Balance this chemical equation.', icon: 'Scale' },
        { id: 'periodic', label: 'Елемент', prompt: 'Tell me about this element.', icon: 'Atom' },
        { id: 'molar', label: 'Моларна маса', prompt: 'Calculate the molar mass.', icon: 'Calculator' },
        { id: 'organic', label: 'Органична', prompt: 'Explain this organic structure.', icon: 'Hexagon' }
    ]
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология',
    icon: 'Dna',
    color: 'bg-emerald-500',
    modes: [AppMode.LEARN],
    description: 'Живот и природа.',
    categories: ['school'],
    quickActions: [
        { id: 'cell', label: 'Клетка', prompt: 'Describe the cell structure.', icon: 'Circle' },
        { id: 'dna', label: 'ДНК', prompt: 'Explain DNA replication.', icon: 'Dna' },
        { id: 'evolution', label: 'Еволюция', prompt: 'Explain the theory of evolution.', icon: 'Activity' }
    ]
  },
  {
    id: SubjectId.HISTORY,
    name: 'История',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.LEARN],
    description: 'Събития и дати.',
    categories: ['school', 'university'],
    quickActions: [
        { id: 'timeline', label: 'Хронология', prompt: 'Create a timeline of events.', icon: 'Clock' },
        { id: 'figures', label: 'Личности', prompt: 'Who were the key figures?', icon: 'User' },
        { id: 'causes', label: 'Причини', prompt: 'What caused this event?', icon: 'HelpCircle' }
    ]
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География',
    icon: 'Globe',
    color: 'bg-cyan-500',
    modes: [AppMode.LEARN],
    description: 'Държави и карти.',
    categories: ['school'],
    quickActions: [
        { id: 'capital', label: 'Столица', prompt: 'What is the capital and key facts?', icon: 'MapPin' },
        { id: 'climate', label: 'Климат', prompt: 'Describe the climate.', icon: 'Cloud' },
        { id: 'economy', label: 'Икономика', prompt: 'Analyze the economy of this region.', icon: 'TrendingUp' }
    ]
  },
  {
    id: SubjectId.IT,
    name: 'Информатика',
    icon: 'Cpu',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Програмиране и технологии.',
    categories: ['school'],
    quickActions: [
        { id: 'debug', label: 'Debug', prompt: 'Find the bug in this code.', icon: 'Bug' },
        { id: 'explain_code', label: 'Explain Code', prompt: 'Explain what this code does line by line.', icon: 'Code' },
        { id: 'algorithm', label: 'Algorithm', prompt: 'Suggest an algorithm for this.', icon: 'GitBranch' },
        { id: 'python', label: 'Python', prompt: 'Write this in Python.', icon: 'Terminal' }
    ]
  },
  {
    id: SubjectId.ART,
    name: 'Изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.DRAW, AppMode.PRESENTATION, AppMode.LEARN],
    description: 'Рисуване и дизайн.',
    categories: ['school', 'university'],
    quickActions: [
        { id: 'idea', label: 'Идея', prompt: 'Give me a drawing idea.', icon: 'Lightbulb' },
        { id: 'history', label: 'История', prompt: 'Tell me about this art movement.', icon: 'Book' },
        { id: 'technique', label: 'Техника', prompt: 'How to use this technique?', icon: 'PenTool' }
    ]
  },
  // Add placeholder actions for others to ensure "1000 things" feel
  {
    id: SubjectId.GERMAN, name: 'Немски език', icon: 'Languages', color: 'bg-yellow-500', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Граматика и лексика.', categories: ['school', 'university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.RUSSIAN, name: 'Руски език', icon: 'Languages', color: 'bg-red-600', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Граматика и разговори.', categories: ['school', 'university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.FRENCH, name: 'Френски език', icon: 'Languages', color: 'bg-blue-600', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Превод и упражнения.', categories: ['school', 'university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.SPANISH, name: 'Испански език', icon: 'Languages', color: 'bg-orange-500', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Граматика и разговори.', categories: ['school', 'university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.MUSIC, name: 'Музика', icon: 'Music', color: 'bg-pink-400', modes: [AppMode.LEARN], description: 'Теория и история.', categories: ['school'],
    quickActions: [{id:'chords', label:'Chords', prompt:'Show chords', icon:'Music'}]
  },
  {
    id: SubjectId.JAPANESE, name: 'Японски език', icon: 'Languages', color: 'bg-red-400', modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT], description: 'Кандзи и култура.', categories: ['school', 'university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.TECHNOLOGIES, name: 'Технологии', icon: 'Wrench', color: 'bg-slate-500', modes: [AppMode.LEARN], description: 'Предприемачество и техника.', categories: ['school'],
    quickActions: commonActions
  },
  {
    id: SubjectId.PHILOSOPHY, name: 'Философия', icon: 'Brain', color: 'bg-purple-400', modes: [AppMode.LEARN], description: 'Логика и етика.', categories: ['school', 'university'],
    quickActions: [{id:'argue', label:'Argument', prompt:'Present an argument', icon:'MessageSquare'}]
  },
  {
    id: SubjectId.CITIZENSHIP, name: 'Гражданско Образование', icon: 'Users', color: 'bg-indigo-400', modes: [AppMode.LEARN], description: 'Права и общество.', categories: ['school'],
    quickActions: commonActions
  },
  {
    id: SubjectId.RELIGION, name: 'Религия', icon: 'Book', color: 'bg-amber-700', modes: [AppMode.LEARN], description: 'Вяра и история.', categories: ['school'],
    quickActions: commonActions
  },
  {
    id: SubjectId.PE, name: 'Спорт', icon: 'Activity', color: 'bg-orange-500', modes: [AppMode.LEARN], description: 'Фитнес и здраве.', categories: ['school'],
    quickActions: [{id:'workout', label:'Workout', prompt:'Give me a workout plan', icon:'Activity'}]
  },
  {
    id: SubjectId.HIGHER_MATH, name: 'Висша Математика', icon: 'Sigma', color: 'bg-blue-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Анализ, Алгебра, Статистика.', categories: ['university'],
    quickActions: [{id:'limit', label:'Limit', prompt:'Calculate limit', icon:'ArrowRight'}, {id:'matrix', label:'Matrix', prompt:'Solve matrix', icon:'Grid'}]
  },
  {
    id: SubjectId.COMPUTER_SCIENCE, name: 'Компютърни Науки', icon: 'Terminal', color: 'bg-slate-800', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Алгоритми, Структури, ООП.', categories: ['university'],
    quickActions: [{id:'complexity', label:'Complexity', prompt:'Analyze time complexity', icon:'Clock'}]
  },
  {
    id: SubjectId.ECONOMICS, name: 'Икономика', icon: 'TrendingUp', color: 'bg-emerald-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Макро, Микро, Финанси.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.FINANCE, name: 'Финанси', icon: 'Banknote', color: 'bg-emerald-600', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Банково дело, инвестиции.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.MANAGEMENT, name: 'Мениджмънт', icon: 'Briefcase', color: 'bg-blue-800', modes: [AppMode.LEARN, AppMode.TEACHER_PLAN], description: 'Управление на бизнес.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.LAW, name: 'Право', icon: 'Scale', color: 'bg-amber-800', modes: [AppMode.LEARN], description: 'Гражданско, Наказателно, Търговско.', categories: ['university'],
    quickActions: [{id:'case', label:'Case Study', prompt:'Analyze this case', icon:'FileText'}]
  },
  {
    id: SubjectId.MEDICINE, name: 'Медицина', icon: 'Stethoscope', color: 'bg-red-600', modes: [AppMode.LEARN], description: 'Анатомия, Патология, Фармация.', categories: ['university'],
    quickActions: [{id:'diagnosis', label:'Diagnosis', prompt:'Differential diagnosis', icon:'Activity'}]
  },
  {
    id: SubjectId.DENTAL_MEDICINE, name: 'Дентална Медицина', icon: 'Smile', color: 'bg-cyan-500', modes: [AppMode.LEARN], description: 'Стоматология и хирургия.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.PHARMACY, name: 'Фармация', icon: 'Pill', color: 'bg-green-600', modes: [AppMode.LEARN], description: 'Лекарства и химия.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.VETERINARY_MEDICINE, name: 'Ветеринарна Медицина', icon: 'Heart', color: 'bg-green-700', modes: [AppMode.LEARN], description: 'Лечение на животни.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.ENGINEERING, name: 'Инженерство', icon: 'Wrench', color: 'bg-orange-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Механика, Електроника, Автоматизация.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.ARCHITECTURE, name: 'Архитектура', icon: 'Ruler', color: 'bg-stone-500', modes: [AppMode.DRAW, AppMode.LEARN], description: 'Сгради и дизайн.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.PSYCHOLOGY, name: 'Психология', icon: 'Brain', color: 'bg-purple-600', modes: [AppMode.LEARN], description: 'Когнитивна, Социална, Клинична.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.PEDAGOGY, name: 'Педагогика', icon: 'BookOpen', color: 'bg-rose-400', modes: [AppMode.LEARN, AppMode.TEACHER_PLAN], description: 'Методика на преподаване.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.MARKETING, name: 'Маркетинг', icon: 'Megaphone', color: 'bg-pink-600', modes: [AppMode.LEARN, AppMode.TEACHER_PLAN], description: 'Бизнес стратегии, Реклама, PR.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.JOURNALISM, name: 'Журналистика', icon: 'Newspaper', color: 'bg-zinc-600', modes: [AppMode.LEARN], description: 'Медии и комуникации.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.POLITICAL_SCIENCE, name: 'Политология', icon: 'Landmark', color: 'bg-purple-700', modes: [AppMode.LEARN], description: 'Политика и управление.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.INT_RELATIONS, name: 'Международни Отношения', icon: 'Globe', color: 'bg-sky-600', modes: [AppMode.LEARN], description: 'Дипломация и политика.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.SOCIOLOGY, name: 'Социология', icon: 'Users', color: 'bg-orange-600', modes: [AppMode.LEARN], description: 'Общество и процеси.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.STATISTICS, name: 'Статистика', icon: 'BarChart2', color: 'bg-cyan-700', modes: [AppMode.SOLVE, AppMode.LEARN], description: 'Вероятности, Анализ на данни.', categories: ['university'],
    quickActions: [{id:'dist', label:'Distribution', prompt:'Analyze distribution', icon:'BarChart2'}]
  },
  {
    id: SubjectId.ECOLOGY, name: 'Екология', icon: 'Leaf', color: 'bg-lime-600', modes: [AppMode.LEARN], description: 'Опазване на средата.', categories: ['university'],
    quickActions: commonActions
  },
  {
    id: SubjectId.TOURISM, name: 'Туризъм', icon: 'Map', color: 'bg-orange-400', modes: [AppMode.LEARN], description: 'Хотелиерство и пътувания.', categories: ['university'],
    quickActions: commonActions
  }
];
