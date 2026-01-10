
import { Language } from './utils/translations';

export enum SubjectId {
  GENERAL = 'general',
  
  // CORE / STANDARD SUBJECTS (School)
  BULGARIAN = 'bulgarian',
  MATH = 'math',
  FOREIGN_LANG = 'foreign_lang',
  IT_CS = 'it_cs',
  BIOLOGY = 'biology',
  CHEMISTRY = 'chemistry',
  PHYSICS = 'physics',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  CIVIC_ED = 'civic_ed',
  VISUAL_ARTS = 'visual_arts',
  MUSIC = 'music',
  PE = 'pe',
  PHILOSOPHY = 'philosophy',
  ENTREPRENEURSHIP = 'entrepreneurship',

  // OPTIONAL / SPECIALIZED (School)
  SECOND_LANG = 'second_lang',
  MOTHER_TONGUE = 'mother_tongue',
  RELIGION = 'religion',
  CHOREOGRAPHY = 'choreography',
  PROG_MODELING = 'prog_modeling',
  ECOLOGY = 'ecology',
  PERSONAL_FINANCE = 'personal_finance',
  HEALTH_ED = 'health_ed',

  // UPPER SECONDARY PROFILES (Grades 11-12)
  PROFILE_HUMANITIES = 'profile_humanities',
  PROFILE_SOCIAL_ECON = 'profile_social_econ',
  PROFILE_STEM = 'profile_stem',
  PROFILE_NATURAL_SCI = 'profile_natural_sci',
  PROFILE_ARTS_MUSIC = 'profile_arts_music',
  PROFILE_PE_SPORTS = 'profile_pe_sports',
  
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
  UNI_LANG_COURSES = 'uni_lang_courses',
  
  // UNIVERSITY - Law & Governance
  UNI_LAW_CONSTITUTIONAL = 'uni_law_constitutional',
  UNI_LAW_CIVIL = 'uni_law_civil',
  UNI_LAW_CRIMINAL = 'uni_law_criminal',
  UNI_LAW_ADMINISTRATIVE = 'uni_law_administrative',
  UNI_LAW_INTERNATIONAL = 'uni_law_international',
  UNI_LAW_EU = 'uni_law_eu',
  
  // UNIVERSITY - Economics & Business
  UNI_ECON_MICRO = 'uni_econ_micro',
  UNI_ECON_MACRO = 'uni_econ_macro',
  UNI_ECON_ACCOUNTING = 'uni_econ_accounting',
  UNI_ECON_FINANCE = 'uni_econ_finance',
  UNI_ECON_BIZ_ADMIN = 'uni_econ_biz_admin',
  UNI_ECON_MANAGEMENT = 'uni_econ_management',
  UNI_ECON_MARKETING = 'uni_econ_marketing',
  UNI_ECON_INT_BUSINESS = 'uni_econ_int_business',
  UNI_ECON_ENTREPRENEURSHIP = 'uni_econ_entrepreneurship',
  UNI_ECON_STRATEGIC_MGMT = 'uni_econ_strategic_mgmt',
  
  // UNIVERSITY - STEM
  UNI_STEM_MATH = 'uni_stem_math',
  UNI_STEM_PHYSICS = 'uni_stem_physics',
  UNI_STEM_CHEMISTRY = 'uni_stem_chemistry',
  UNI_STEM_BIOLOGY = 'uni_stem_biology',
  UNI_STEM_CS_PROG = 'uni_stem_cs_prog',
  UNI_STEM_INFO_SYSTEMS = 'uni_stem_info_systems',
  UNI_STEM_SW_ENGINEERING = 'uni_stem_sw_engineering',
  UNI_STEM_DSA = 'uni_stem_dsa',
  UNI_STEM_DATABASES = 'uni_stem_databases',
  UNI_STEM_CYBERSECURITY = 'uni_stem_cybersecurity',
  UNI_STEM_ELECTRICAL_ENG = 'uni_stem_electrical_eng',
  UNI_STEM_MECHANICAL_ENG = 'uni_stem_mechanical_eng',
  UNI_STEM_CIVIL_ENG = 'uni_stem_civil_eng',
  UNI_STEM_ENV_ENGINEERING = 'uni_stem_env_engineering',
  
  // UNIVERSITY - Medical & Health
  UNI_MED_ANATOMY = 'uni_med_anatomy',
  UNI_MED_PHYSIOLOGY = 'uni_med_physiology',
  UNI_MED_BIOCHEMISTRY = 'uni_med_biochemistry',
  UNI_MED_PATHOLOGY = 'uni_med_pathology',
  UNI_MED_SURGERY = 'uni_med_surgery',
  UNI_MED_INTERNAL = 'uni_med_internal',
  UNI_MED_PEDIATRICS = 'uni_med_pediatrics',
  UNI_MED_PUBLIC_HEALTH = 'uni_med_public_health',
  UNI_MED_NURSING = 'uni_med_nursing',
  UNI_MED_PHARMACY = 'uni_med_pharmacy',
  UNI_MED_DENTAL = 'uni_med_dental',
  UNI_MED_HEALTH_MGMT = 'uni_med_health_mgmt',
  
  // UNIVERSITY - Arts & Design
  UNI_ARTS_VISUAL = 'uni_arts_visual',
  UNI_ARTS_GRAPHIC_DESIGN = 'uni_arts_graphic_design',
  UNI_ARTS_MUSIC = 'uni_arts_music',
  UNI_ARTS_PERFORMING = 'uni_arts_performing',
  UNI_ARTS_THEATRE = 'uni_arts_theatre',
  UNI_ARTS_FILM_MEDIA = 'uni_arts_film_media',
  
  // UNIVERSITY - Education
  UNI_EDU_PEDAGOGY = 'uni_edu_pedagogy',
  UNI_EDU_CURRICULUM = 'uni_edu_curriculum',
  UNI_EDU_PSYCHOLOGY = 'uni_edu_psychology',
  UNI_EDU_SPECIAL = 'uni_edu_special',
  
  // UNIVERSITY - Other
  UNI_OTHER_TOURISM = 'uni_other_tourism',
  UNI_OTHER_ENV_STUDIES = 'uni_other_env_studies',
  UNI_OTHER_GEOGRAPHY = 'uni_other_geography',
  UNI_OTHER_GEOLOGY = 'uni_other_geology',
  UNI_OTHER_THEOLOGY = 'uni_other_theology',
  UNI_OTHER_JOURNALISM = 'uni_other_journalism'
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

export type SubjectCategory = 'school' | 'university' | 'profile';

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
  isDemo?: boolean;
  type?: 'text' | 'image_generated' | 'slides' | 'test_generated' | 'video'; 
  videoUrl?: string;
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
  newYearMode?: boolean;
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
