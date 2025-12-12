import { SubjectId, AppMode, SubjectConfig } from './types';

export const AI_MODELS = [
  { id: 'auto', name: 'Автоматичен', description: 'Избира най-добрия модел (Chimera R1).' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek Chimera', description: 'Мощен модел за сложни задачи.' }
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
  DEFAULT: `Ти си полезен AI асистент за ученици. Помагай с уроците, решавай задачи и отговаряй на въпроси. Винаги бъди учтив и насърчаващ. Отговаряй на български език освен ако не е указано друго (например за час по английски).
  
  ВАЖНО ЗА МАТЕМАТИКА:
  Винаги използвай LaTeX форматиране за всички математически формули и символи.
  - Задължително ограждай формулите с $ за inline (в реда) или $$ за блок (нов ред).
  - Пример: "Решението е $x = 5$." или "$$\\sqrt{a^2 + b^2}$$".
  - Никога не пиши "sqrt", "alpha", "approx" като обикновен текст, използвай съответно $\\sqrt{...}$, $\\alpha$, $\\approx$.`,

  LEARN: `Ти си учител. Твоята цел е да научиш ученика на дадена тема. Не давай просто отговорите, а обяснявай концепциите. Използвай примери и аналогии. Структурирай информацията логично.
  
  ВАЖНО ЗА МАТЕМАТИКА:
  Използвай LaTeX ($...$ или $$...$$) за всяка формула, числова зависимост или символ. Това прави текста по-четлив и професионален.`,

  SOLVE: `Ти си помощник за решаване на задачи. Когато ти се даде задача, реши я стъпка по стъпка. Обясни всяка стъпка ясно.
  
  ВАЖНО ЗА МАТЕМАТИКА:
  - ИЗПОЛЗВАЙ LaTeX ($...$ или $$...$$) ЗА ВСИЧКИ математически изрази, формули и символи.
  - Увери се, че използваш правилните команди: $\\sqrt{...}$ за корен, $\\approx$ за приблизително, $\\cdot$ за умножение, $\\frac{a}{b}$ за дроби.
  
  Ако задачата изисква геометричен чертеж или илюстрация (особено по геометрия или физика), ГЕНЕРИРАЙ SVG код в специален JSON блок. Не питай дали да го направиш, просто го направи.
  Форматът трябва да бъде:
  \`\`\`json:geometry
  {
    "title": "Кратко описание",
    "svg": "<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'>...</svg>"
  }
  \`\`\`
  Увери се, че SVG кодът е валиден и визуализира правилно условието.`,

  PRESENTATION: `Създай план за презентация. Структурирай го в слайдове. За всеки слайд дай заглавие, съдържание (булети) и бележки за презентатора. Върни отговора САМО в JSON формат.`,
  
  // Teacher Prompts
  TEACHER_TEST: `Ти си помощник на учителя. Твоята задача е да създаваш и редактираш тестове.

  ВАЖНИ ИНСТРУКЦИИ ЗА РЕДАКТИРАНЕ:
  1. Ако потребителят поиска промяна, ТРЯБВА да вземеш предвид съществуващия тест от историята.
  2. Върни ЦЕЛИЯ обновен тест като JSON.

  ВАЖНО ЗА ФОРМАТИРАНЕТО:
  1. Върни резултата в СТРИКТЕН JSON формат.
  2. НЕ използвай Markdown форматиране вътре в текстовете.
  3. Използвай Unicode символи за математика (x², √x, π, etc).
  
  ГРАФИКИ, ЧЕРТЕЖИ И ДАННИ:
  1. Ако въпросът изисква графика/диаграма, добави поле "chartData".
  2. Ако въпросът е по геометрия и изисква чертеж (напр. триъгълник, окръжност), добави поле "geometryData" с валиден SVG код. Това е МНОГО ВАЖНО за геометрия.
  
  Формат на JSON (schema):
  {
    "title": "Заглавие на теста",
    "subject": "Предмет",
    "grade": "Клас",
    "questions": [
       {
         "id": 1,
         "question": "Текст на въпроса",
         "type": "multiple_choice" или "open_answer",
         "options": ["А) ...", "Б) ..."], 
         "correctAnswer": "Верен отговор",
         "chartData": { ... }, // Опционално (за статистика)
         "geometryData": {     // Опционално (за геометрия)
            "title": "Чертеж",
            "svg": "<svg viewBox='0 0 200 200' ...> <polygon points='...' stroke='black' fill='none' stroke-width='2'/> ... </svg>"
         }
       }
    ]
  }

  Върни само JSON обекта.`,
  
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