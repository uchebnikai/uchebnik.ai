
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
  
  // Teacher Modes
  TEACHER_TEST = 'teacher_test',
  TEACHER_PLAN = 'teacher_plan',
  TEACHER_RESOURCES = 'teacher_resources'
}

export type HomeViewType = 'landing' | 'school_select' | 'university_select' | 'student_subjects' | 'teacher_subjects' | 'uni_student_subjects' | 'uni_teacher_subjects' | 'terms' | 'privacy' | 'cookies' | 'about' | 'contact';

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
  enterToSend: boolean;
  fontFamily: FontFamily;
}

// --- Admin & Analytics Types ---

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: 'start_session' | 'send_message' | 'upgrade_click' | 'error' | 'page_view';
  subject_id?: string;
  mode?: string;
  metadata?: any;
  created_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  is_active: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id?: string;
  details?: any;
  created_at: string;
}

export interface UserProfileExtended {
  id: string;
  email?: string;
  full_name?: string;
  plan: UserPlan;
  is_banned: boolean;
  last_active_at?: string;
  created_at: string;
  usage_stats?: {
    total_tokens: number;
    messages_count: number;
  };
}
