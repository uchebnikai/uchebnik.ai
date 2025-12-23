
import { Language } from './utils/translations';

export enum SubjectId {
  GENERAL = 'general',
  ENGLISH = 'english',
  BULGARIAN = 'bulgarian',
  FRENCH = 'french',
  SPANISH = 'spanish',
  GERMAN = 'german', 
  RUSSIAN = 'russian', 
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
  MUSIC = 'music', 
  TECHNOLOGIES = 'technologies', 
  CITIZENSHIP = 'citizenship', 
  RELIGION = 'religion', 
  
  // University Subjects
  HIGHER_MATH = 'higher_math',
  COMPUTER_SCIENCE = 'computer_science',
  ECONOMICS = 'economics',
  LAW = 'law',
  MEDICINE = 'medicine',
  DENTAL_MEDICINE = 'dental_medicine', 
  PHARMACY = 'pharmacy', 
  VETERINARY_MEDICINE = 'veterinary_medicine', 
  ENGINEERING = 'engineering',
  ARCHITECTURE = 'architecture', 
  MARKETING = 'marketing',
  FINANCE = 'finance', 
  MANAGEMENT = 'management', 
  PSYCHOLOGY = 'psychology',
  STATISTICS = 'statistics',
  PEDAGOGY = 'pedagogy', 
  POLITICAL_SCIENCE = 'political_science', 
  INT_RELATIONS = 'int_relations', 
  JOURNALISM = 'journalism', 
  SOCIOLOGY = 'sociology', 
  ECOLOGY = 'ecology', 
  TOURISM = 'tourism' 
}

export enum AppMode {
  SOLVE = 'solve', 
  LEARN = 'learn', 
  DRAW = 'draw',   
  PRESENTATION = 'presentation', 
  CHAT = 'chat',    
  
  TEACHER_TEST = 'teacher_test',
  TEACHER_PLAN = 'teacher_plan',
  TEACHER_RESOURCES = 'teacher_resources'
}

export type HomeViewType = 'landing' | 'school_select' | 'university_select' | 'student_subjects' | 'teacher_subjects' | 'uni_student_subjects' | 'uni_teacher_subjects' | 'terms' | 'privacy' | 'cookies' | 'about' | 'contact' | 'auth_success';

export type UserRole = 'student' | 'teacher' | 'uni_student' | 'uni_teacher';

export type SubjectCategory = 'school' | 'university';

export interface SubjectConfig {
  id: SubjectId;
  name: string; 
  icon: string;
  color: string;
  modes: AppMode[];
  description: string; 
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
  svg: string; 
}

export interface TestQuestion {
  id: number;
  question: string;
  options?: string[]; 
  correctAnswer?: string; 
  type: 'multiple_choice' | 'open_answer';
  chartData?: ChartData; 
  geometryData?: GeometryData; 
}

export interface TestData {
  title: string;
  subject: string;
  grade?: string;
  questions: TestQuestion[];
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number; 
  images?: string[]; 
  imageAnalysis?: string; 
  isError?: boolean;
  type?: 'text' | 'image_generated' | 'slides' | 'test_generated';
  slidesData?: Slide[]; 
  testData?: TestData; 
  chartData?: ChartData; 
  geometryData?: GeometryData; 
  rating?: 'up' | 'down'; 
  replyToId?: string; 
  reasoning?: string; 
  isStreaming?: boolean; 
  sources?: SearchSource[]; 
  usage?: TokenUsage;
}

export interface Session {
  id: string;
  subjectId: SubjectId;
  title: string;
  createdAt: number;
  lastModified: number;
  messages: Message[];
  preview: string; 
  role?: UserRole; 
  mode?: AppMode;  
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

export type TeachingStyle = 'normal' | 'socratic' | 'eli5' | 'academic' | 'motivational';
export type FontFamily = 'inter' | 'dyslexic' | 'mono';

export interface DailyQuest {
  id: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
  type: 'message' | 'image' | 'voice' | string; // string for subject_ids
}

export interface UserSettings {
  userName: string;
  textSize: 'small' | 'normal' | 'large';
  haptics: boolean;
  notifications: boolean; 
  sound: boolean; 
  responseLength: 'concise' | 'detailed';
  creativity: 'strict' | 'balanced' | 'creative';
  languageLevel: 'simple' | 'standard' | 'advanced';
  preferredModel: string;
  themeColor: string; 
  customBackground: string | null; 
  language: Language; 
  teachingStyle: TeachingStyle;
  socraticMode?: boolean; 
  customPersona?: string; 
  enterToSend: boolean;
  fontFamily: FontFamily;
  christmasMode?: boolean; 
  preferredVoice: string; 
  referralCode?: string; 
  proExpiresAt?: string; 
  
  // Gamification
  xp: number;
  level: number;
  dailyQuests?: {
      date: string;
      quests: DailyQuest[];
  };
  
  stats?: {
      dailyImageCount?: number;
      lastImageDate?: string;
      lastVisit?: string;
      totalInputTokens?: number;
      totalOutputTokens?: number;
      costCorrection?: number; 
  };
}

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface RankInfo {
    id: RankTier;
    name: string;
    minLevel: number;
    color: string;
    gradient: string;
    icon: any;
}

export interface LeaderboardEntry {
    userId: string;
    name: string;
    avatar?: string;
    xp: number;
    level: number;
    rank: number;
    isCurrentUser?: boolean;
}

// Admin & System Types
export interface AdminLog {
    id: string;
    admin_id: string;
    action: string;
    details: any;
    created_at: string;
}

export interface ErrorLog {
    id: string;
    user_id?: string;
    error: string;
    context: any;
    created_at: string;
}

export interface FeatureFlag {
    key: string;
    enabled: boolean;
    description: string;
}

export interface AppConfig {
    global_xp_multiplier: number;
}
