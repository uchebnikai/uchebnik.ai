

import { SubjectId, AppMode, SubjectConfig } from './types';

export const AI_MODELS = [
  { id: 'auto', name: 'Автоматичен', description: 'Избира най-добрия модел според предмета.' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Бърз и ефективен за повечето задачи.' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', description: 'Най-умният модел. Отличен за математика и логика.' }
];

export const GRADE_PROMPTS = {
  '1-4': `ВАЖНО: Потребителят е ученик в начален етап (1-4 клас).
  - Използвай много прости думи и кратки изречения.
  - Обяснявай като на дете.
  - Използвай емотикони и приятелски тон.`,
  '5-7': `ВАЖНО: Потребителят е ученик в прогимназиален етап (5-7 клас).
  - Обяснявай ясно и достъпно.
  - Избягвай прекалено сложна терминология, освен ако не е обяснена.`,
  '8-12': `ВАЖНО: Потребителят е ученик в гимназиален етап (8-12 клас).
  - Използвай академичен, но разбираем език.
  - Можеш да навлизаш в детайли.`,
  'university': `ВАЖНО: Потребителят е студент.
  - Използвай високо ниво на академичен език.
  - Бъди изчерпателен и точен.`
};

export const SYSTEM_PROMPTS = {
  DEFAULT: `Ти си полезен AI асистент за ученици. Помагай с уроците, решавай задачи и отговаряй на въпроси. Винаги бъди учтив и насърчаващ. Отговаряй на български език освен ако не е указано друго (например за час по английски).`,
  LEARN: `Ти си учител. Твоята цел е да научиш ученика на дадена тема. Не давай просто отговорите, а обяснявай концепциите. Използвай примери и аналогии. Структурирай информацията логично.`,
  SOLVE: `Ти си помощник за решаване на задачи. Когато ти се даде задача, реши я стъпка по стъпка. Обясни всяка стъпка ясно. Ако задачата е математическа, използвай LaTeX за формулите.
  
  Ако задачата изисква геометричен чертеж или илюстрация (особено по геометрия или физика), ГЕНЕРИРАЙ SVG код в специален JSON блок. Не питай дали да го направиш, просто го направи.
  Форматът трябва да бъде:
  \`\`\`json:geometry
  {
    "title": "Кратко описание",
    "svg": "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'>...</svg>"
  }
  \`\`\`
  Увери се, че SVG кодът е валиден и визуализира правилно условието.`,
  PRESENTATION: `Създай план за презентация. Структурирай го в слайдове. За всеки слайд дай заглавие, съдържание (булети) и бележки за презентатора. Върни отговора в JSON формат, както е описано в схемата.`,
  
  // Teacher Prompts
  TEACHER_TEST: `Ти си помощник на учителя. Създай тест за проверка на знанията по зададената тема. Включи разнообразни въпроси (отворен отговор, затворен отговор).
  
  ВАЖНО: Трябва да върнеш резултата в стриктен JSON формат, за да мога да го форматирам в документ.
  
  Формат на JSON (schema):
  {
    "title": "Заглавие на теста",
    "subject": "Предмет",
    "grade": "Клас (ако е приложимо)",
    "questions": [
       {
         "id": 1,
         "question": "Текст на въпроса",
         "type": "multiple_choice" или "open_answer",
         "options": ["А) отговор 1", "Б) отговор 2", "В) отговор 3", "Г) отговор 4"], // само ако type е multiple_choice
         "correctAnswer": "Верен отговор (напр. 'Б')"
       }
    ]
  }

  Върни само JSON обекта, без допълнителен текст преди или след него.`,
  
  TEACHER_PLAN: `Ти си помощник на учителя. Създай подробен план на урок (конспект). Включи: Цели на урока, Очаквани резултати, Необходими материали, План на протичане (Въведение, Изложение, Заключение, Упражнение).`,
  TEACHER_RESOURCES: `Ти си помощник на учителя. Предложи идеи за допълнителни материали, интерактивни занимания, домашни работи и проекти за учениците по дадената тема.`
};

export const SUBJECTS: SubjectConfig[] = [
  {
    id: SubjectId.GENERAL,
    name: 'Общ Чат',
    icon: 'MessageSquare',
    color: 'bg-indigo-500',
    modes: [AppMode.CHAT],
    description: 'Попитай ме каквото и да е.'
  },
  {
    id: SubjectId.MATH,
    name: 'Математика',
    icon: 'Calculator',
    color: 'bg-blue-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Алгебра, геометрия и задачи.'
  },
  {
    id: SubjectId.BULGARIAN,
    name: 'Български език',
    icon: 'BookOpen',
    color: 'bg-red-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Граматика и литература.'
  },
  {
    id: SubjectId.ENGLISH,
    name: 'Английски език',
    icon: 'Languages',
    color: 'bg-blue-400',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Превод и упражнения.'
  },
  {
    id: SubjectId.PHYSICS,
    name: 'Физика',
    icon: 'Atom',
    color: 'bg-violet-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Закони и формули.'
  },
  {
    id: SubjectId.CHEMISTRY,
    name: 'Химия',
    icon: 'FlaskConical',
    color: 'bg-green-500',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Реакции и елементи.'
  },
  {
    id: SubjectId.BIOLOGY,
    name: 'Биология',
    icon: 'Dna',
    color: 'bg-emerald-500',
    modes: [AppMode.LEARN],
    description: 'Живот и природа.'
  },
  {
    id: SubjectId.HISTORY,
    name: 'История',
    icon: 'Landmark',
    color: 'bg-amber-600',
    modes: [AppMode.LEARN],
    description: 'Събития и дати.'
  },
  {
    id: SubjectId.GEOGRAPHY,
    name: 'География',
    icon: 'Globe',
    color: 'bg-cyan-500',
    modes: [AppMode.LEARN],
    description: 'Държави и карти.'
  },
   {
    id: SubjectId.FRENCH,
    name: 'Френски език',
    icon: 'Languages',
    color: 'bg-blue-600',
    modes: [AppMode.SOLVE, AppMode.LEARN, AppMode.CHAT],
    description: 'Превод и упражнения.'
  },
  {
    id: SubjectId.IT,
    name: 'Информатика',
    icon: 'Cpu',
    color: 'bg-slate-600',
    modes: [AppMode.SOLVE, AppMode.LEARN],
    description: 'Програмиране и технологии.'
  },
  {
    id: SubjectId.PHILOSOPHY,
    name: 'Философия',
    icon: 'Brain',
    color: 'bg-purple-400',
    modes: [AppMode.LEARN],
    description: 'Логика и етика.'
  },
  {
    id: SubjectId.ART,
    name: 'Изкуство',
    icon: 'Palette',
    color: 'bg-pink-500',
    modes: [AppMode.DRAW, AppMode.PRESENTATION, AppMode.LEARN],
    description: 'Рисуване и дизайн.'
  },
  {
    id: SubjectId.PE,
    name: 'Спорт',
    icon: 'Activity',
    color: 'bg-orange-500',
    modes: [AppMode.LEARN],
    description: 'Фитнес и здраве.'
  }
];