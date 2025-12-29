
import { Language } from './utils/translations';

export enum SubjectId {
  GENERAL = 'general',
  ENGLISH = 'english',
  BULGARIAN = 'bulgarian',
  FRENCH = 'french',
  SPANISH = 'spanish',
  GERMAN = 'german', 
  RUSSIAN = 'russian', 
  ITALIAN = 'italian',
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
  ENTREPRENEURSHIP = 'entrepreneurship',
  CHOREOGRAPHY = 'choreography',
  PROGRAMMING = 'programming',
  
  // UNIVERSITY - Humanities & Social Sciences
  UNI_PHILOSOPHY = 'uni_philosophy',
  UNI_HISTORY = 'uni_history',
  UNI_SOCIOLOGY = 'uni_sociology',
  UNI_PSYCHOLOGY = 'uni_psychology',
  UNI_POLITICAL_SCIENCE = 'uni_political_science',
  UNI_INT_RELATIONS = 'uni_int_relations',
  UNI_CULTURAL_STUDIES = 'uni_cultural_studies',
  UNI_LINGUISTICS = 'uni_linguistics',
  UNI_LITERATURE = 'uni_literature',
  
  // UNIVERSITY - Law & Governance
  LAW_CONSTITUTIONAL = 'law_constitutional',
  LAW_CIVIL = 'law_civil',
  LAW_CRIMINAL = 'law_criminal',
  LAW_ADMINISTRATIVE = 'law_administrative',
  LAW_INTERNATIONAL = 'law_international',
  LAW_EU = 'law_eu',
  
  // UNIVERSITY - Economics & Business
  ECON_MICRO = 'econ_micro',
  ECON_MACRO = 'econ_macro',
  ECON_ACCOUNTING = 'econ_accounting',
  ECON_FINANCE = 'econ_finance',
  ECON_BIZ_ADMIN = 'econ_biz_admin',
  ECON_MANAGEMENT = 'econ_management',
  ECON_MARKETING = 'econ_marketing',
  ECON_INT_BUSINESS = 'econ_int_business',
  ECON_ENTREPRENEURSHIP = 'econ_entrepreneurship',
  ECON_STRATEGIC_MGMT = 'econ_strategic_mgmt',
  
  // UNIVERSITY - STEM
  STEM_MATH = 'stem_math',
  STEM_PHYSICS = 'stem_physics',
  STEM_CHEMISTRY = 'stem_chemistry',
  STEM_BIOLOGY = 'stem_biology',
  STEM_CS_PROG = 'stem_cs_prog',
  STEM_INFO_SYSTEMS = 'stem_info_systems',
  STEM_SW_ENGINEERING = 'stem_sw_engineering',
  STEM_DSA = 'stem_dsa',
  STEM_DATABASES = 'stem_databases',
  STEM_CYBERSECURITY = 'stem_cybersecurity',
  STEM_ELECTRICAL_ENG = 'stem_electrical_eng',
  STEM_MECHANICAL_ENG = 'stem_mechanical_eng',
  STEM_CIVIL_ENG = 'stem_civil_eng',
  STEM_ENV_ENGINEERING = 'stem_env_engineering',
  
  // UNIVERSITY - Medical & Health
  MED_ANATOMY = 'med_anatomy',
  MED_PHYSIOLOGY = 'med_physiology',
  MED_BIOCHEMISTRY = 'med_biochemistry',
  MED_PATHOLOGY = 'med_pathology',
  MED_SURGERY = 'med_surgery',
  MED_INTERNAL = 'med_internal',
  MED_PEDIATRICS = 'med_pediatrics',
  MED_PUBLIC_HEALTH = 'med_public_health',
  MED_NURSING = 'med_nursing',
  MED_PHARMACY = 'med_pharmacy',
  MED_DENTAL = 'med_dental',
  MED_HEALTH_MGMT = 'med_health_mgmt',
  
  // UNIVERSITY - Arts & Design
  ARTS_VISUAL = 'arts_visual',
  ARTS_GRAPHIC_DESIGN = 'arts_graphic_design',
  ARTS_MUSIC = 'arts_music',
  ARTS_PERFORMING = 'arts_performing',
  ARTS_THEATRE = 'arts_theatre',
  ARTS_FILM_MEDIA = 'arts_film_media',
  
  // UNIVERSITY - Education
  EDU_PEDAGOGY = 'edu_pedagogy',
  EDU_CURRICULUM = 'edu_curriculum',
  EDU_PSYCHOLOGY = 'edu_psychology',
  EDU_SPECIAL = 'edu_special',
  
  // UNIVERSITY - Other
  OTHER_TOURISM = 'other_tourism',
  OTHER_ENV_STUDIES = 'other_env_studies',
  OTHER_GEOGRAPHY = 'other_geography',
  OTHER_GEOLOGY = 'other_geology',
  OTHER_THEOLOGY = 'other_theology',
  OTHER_JOURNALISM = 'other_journalism'
}

export enum AppMode {
  SOLVE = 'solve', 
  LEARN = 'learn', 
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
