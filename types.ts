
import { Language } from './utils/translations';

export enum SubjectId {
  GENERAL = 'general',
  ENGLISH = 'english',
  BULGARIAN = 'bulgarian',
  FRENCH = 'french',
  SPANISH = 'spanish',
  JAPANESE = 'japanese',
  CHEMISTRY = 'chemistry',
  PHYSICS = 'physics',
  BIOLOGY = 'biology',
  GEOGRAPHY = 'geography',
  HISTORY = 'history',
  MATH = 'math',
  PHILOSOPHY = 'philosophy',
  IT = 'it',
  PE = 'pe',
  ART = 'art',
  // University Subjects
  HIGHER_MATH = 'higher_math',
  COMPUTER_SCIENCE = 'computer_science',
  ECONOMICS = 'economics',
  LAW = 'law',
  MEDICINE = 'medicine',
  ENGINEERING = 'engineering',
  MARKETING = 'marketing',
  PSYCHOLOGY = 'psychology',
  STATISTICS = 'statistics'
}

export enum AppMode {
  SOLVE = 'solve', // Решаване
  LEARN = 'learn', // Научаване на урок
  DRAW = 'draw',   // Рисуване (Art)
  PRESENTATION = 'presentation', // Презентация (Art)
  CHAT = 'chat',    // Общ чат
  
  // Teacher Modes
  TEACHER_TEST = 'teacher_test',
  TEACHER_PLAN = 'teacher_plan',
  TEACHER_RESOURCES = 'teacher_resources'
}

// New type for managing view state including static pages
export type HomeViewType = 'landing' | 'school_select' | 'university_select' | 'student_subjects' | 'teacher_subjects' | 'uni_student_subjects' | 'uni_teacher_subjects' | 'terms' | 'privacy' | 'cookies' | 'about' | 'contact';

export type UserRole = 'student' | 'teacher' | 'uni_student' | 'uni_teacher';

export type SubjectCategory = 'school' | 'university';

export interface SubjectConfig {
  id: SubjectId;
  name: string; // Internal name, use translation in UI
  icon: string;
  color: string;
  modes: AppMode[];
  description: string; // Internal desc, use translation in UI
  categories: SubjectCategory[];
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

export interface TestQuestion {
  id: number;
  question: string;
  options?: string[]; // If multiple choice
  correctAnswer?: string; // For the key
  type: 'multiple_choice' | 'open_answer';
  chartData?: ChartData; // Optional chart for the question
  geometryData?: GeometryData; // Optional geometry drawing
}

export interface TestData {
  title: string;
  subject: string;
  grade?: string;
  questions: TestQuestion[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number; // New: For history tracking
  images?: string[]; // base64
  imageAnalysis?: string; // Context for the image (fixes bug where context is lost in history)
  isError?: boolean;
  type?: 'text' | 'image_generated' | 'slides' | 'test_generated';
  slidesData?: Slide[]; // For presentation mode
  testData?: TestData; // For teacher test mode
  chartData?: ChartData; // For Math/Physics data visualization
  geometryData?: GeometryData; // For Math/Physics geometric drawings
  rating?: 'up' | 'down'; // User feedback
  replyToId?: string; // ID of the message being replied to
  reasoning?: string; // Content from <think> tags
  isStreaming?: boolean; // Track if the message is currently being generated
}

export interface Session {
  id: string;
  subjectId: SubjectId;
  title: string;
  createdAt: number;
  lastModified: number;
  messages: Message[];
  preview: string; // Short text preview of the last message
  role?: UserRole; // Track which role created this session
  mode?: AppMode;  // Track specific mode
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

export type UserPlan = 'free' | 'plus' | 'pro';

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
  preferredModel: string;
  // New Personalization Settings
  themeColor: string; // Hex code
  customBackground: string | null; // Base64 image
  language: Language; // Added language
}
