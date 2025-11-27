
export enum SubjectId {
  GENERAL = 'general',
  ENGLISH = 'english',
  BULGARIAN = 'bulgarian',
  FRENCH = 'french',
  CHEMISTRY = 'chemistry',
  PHYSICS = 'physics',
  BIOLOGY = 'biology',
  GEOGRAPHY = 'geography',
  HISTORY = 'history',
  MATH = 'math',
  PHILOSOPHY = 'philosophy',
  IT = 'it',
  PE = 'pe',
  ART = 'art'
}

export enum AppMode {
  SOLVE = 'solve', // Решаване
  LEARN = 'learn', // Научаване на урок
  DRAW = 'draw',   // Рисуване (Art)
  PRESENTATION = 'presentation', // Презентация (Art)
  CHAT = 'chat'    // Общ чат
}

export interface SubjectConfig {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  modes: AppMode[];
  description: string;
}

export interface ChartData {
  type: 'line' | 'bar';
  title?: string;
  data: { name: string | number; value: number }[];
  xLabel?: string;
  yLabel?: string;
}

export interface GeometryData {
  title: string;
  svg: string; // Raw SVG string
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number; // New: For history tracking
  images?: string[]; // base64
  isError?: boolean;
  type?: 'text' | 'image_generated' | 'slides';
  slidesData?: Slide[]; // For presentation mode
  chartData?: ChartData; // For Math/Physics data visualization
  geometryData?: GeometryData; // For Math/Physics geometric drawings
  rating?: 'up' | 'down'; // User feedback
}

export interface Session {
  id: string;
  subjectId: SubjectId;
  title: string;
  createdAt: number;
  lastModified: number;
  messages: Message[];
  preview: string; // Short text preview of the last message
}

export interface Slide {
  title: string;
  content: string[];
  notes: string;
}

export interface ChatSession {
  subjectId: SubjectId;
  mode: AppMode;
  messages: Message[];
}

export type GradeLevel = '1-4' | '5-7' | '8-12' | 'university';

export interface UserSettings {
  userName: string;
  gradeLevel: GradeLevel;
  textSize: 'small' | 'normal' | 'large';
  haptics: boolean;
  notifications: boolean; 
  sound: boolean; 
  reduceMotion: boolean;
  responseLength: 'concise' | 'detailed';
  creativity: 'strict' | 'balanced' | 'creative';
  languageLevel: 'simple' | 'standard' | 'advanced';
  preferredModel: 'auto' | 'gemini-2.5-flash' | 'gemini-3-pro-preview';
  // New Personalization Settings
  themeColor: string; // Hex code
  customBackground: string | null; // Base64 image
}
