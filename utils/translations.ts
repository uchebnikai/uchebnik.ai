
export type Language = 'bg' | 'en' | 'de' | 'es' | 'tr' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'nl' | 'pl' | 'ro' | 'el' | 'uk' | 'cs' | 'sv' | 'hu' | 'vi';

export const LANGUAGES: { code: Language; label: string; countryCode: string }[] = [
  { code: 'bg', label: 'Български', countryCode: 'bg' },
  { code: 'en', label: 'English', countryCode: 'gb' },
  { code: 'de', label: 'Deutsch', countryCode: 'de' },
  { code: 'es', label: 'Español', countryCode: 'es' },
  { code: 'fr', label: 'Français', countryCode: 'fr' },
  { code: 'it', label: 'Italiano', countryCode: 'it' },
  { code: 'ru', label: 'Русский', countryCode: 'ru' },
  { code: 'tr', label: 'Türkçe', countryCode: 'tr' },
  { code: 'zh', label: 'Chinese', countryCode: 'cn' },
  { code: 'ja', label: 'Japanese', countryCode: 'jp' },
  { code: 'ko', label: 'Korean', countryCode: 'kr' },
];

const translations: Record<string, Record<string, string>> = {
  // General
  'hello': { bg: 'Здравей', en: 'Hello' },
  'subtitle': { bg: 'Твоят личен AI учител.', en: 'Your personal AI tutor.' },
  'app_name': { bg: 'Uchebnik AI', en: 'Uchebnik AI' },
  'ask_anything': { bg: 'Попитай ме каквото и да е...', en: 'Ask me anything...' },
  'error': { bg: 'Възникна грешка.', en: 'An error occurred.' },
  'delete': { bg: 'Изтрий', en: 'Delete' },
  'delete_all_chats': { bg: 'Изтрий всички чатове', en: 'Delete all chats' },
  'synced': { bg: 'Синхронизирано', en: 'Synced' },
  'syncing': { bg: 'Синхронизиране...', en: 'Syncing...' },
  'sync_error': { bg: 'Грешка при синхронизация', en: 'Sync Error' },
  'chat_general': { bg: 'Общ Чат', en: 'General Chat' },
  'new_chat': { bg: 'Нов чат', en: 'New chat' },
  
  // Navigation & Roles
  'school': { bg: 'Училище', en: 'School' },
  'university': { bg: 'Университет', en: 'University' },
  'students': { bg: 'Ученици', en: 'Students' },
  'teachers': { bg: 'Учители', en: 'Teachers' },
  'uni_students': { bg: 'Студенти', en: 'Students' },
  'uni_professors': { bg: 'Преподаватели', en: 'Professors' },
  'select_role': { bg: 'Избери роля', en: 'Select role' },
  'select_role_uni': { bg: 'Избери роля (Университет)', en: 'Select role (University)' },
  'role_student': { bg: 'Ученик', en: 'Student' },
  'role_teacher': { bg: 'Учител', en: 'Teacher' },
  'role_uni_student': { bg: 'Студент', en: 'Student' },
  'role_uni_professor': { bg: 'Преподавател', en: 'Professor' },
  'desc_student': { bg: 'Помощ с домашни и уроци', en: 'Help with homework and lessons' },
  'desc_teacher': { bg: 'Планове, тестове и ресурси', en: 'Plans, tests and resources' },
  'desc_uni_student': { bg: 'Лекции и изпити', en: 'Lectures and exams' },
  'desc_uni_professor': { bg: 'Академични материали', en: 'Academic materials' },
  'enter': { bg: 'Вход', en: 'Enter' },
  'start': { bg: 'Старт', en: 'Start' },
  'back': { bg: 'Назад', en: 'Back' },
  'back_to_roles': { bg: 'Към ролите', en: 'Back to roles' },
  'select_subject': { bg: 'Избери предмет', en: 'Select subject' },
  'choose_subject': { bg: 'Избери предмет, за да започнеш.', en: 'Choose a subject to start.' },

  // Auth Success Messages
  'auth_success_email_title': { bg: 'Имейлът е потвърден!', en: 'Email Verified!' },
  'auth_success_email_desc': { bg: 'Вашият имейл е успешно потвърден. Акаунтът ви вече е активен.', en: 'Your email has been successfully verified. Your account is now active.' },
  'auth_success_magic_title': { bg: 'Добре дошъл отново!', en: 'Welcome back!' },
  'auth_success_magic_desc': { bg: 'Успешно влязохте чрез Magic Link.', en: 'Successfully logged in via Magic Link.' },
  'auth_success_recovery_title': { bg: 'Възстановяване', en: 'Recovery' },
  'auth_success_recovery_desc': { bg: 'Сега можете да обновите паролата си.', en: 'You can now update your password.' },
  'auth_success_default_title': { bg: 'Успех!', en: 'Success!' },
  'auth_success_default_desc': { bg: 'Действието е изпълнено успешно.', en: 'Action completed successfully.' },
  'continue_to_app': { bg: 'Към приложението', en: 'Continue to App' },
  'login': { bg: 'Вход', en: 'Login' },
  'logout': { bg: 'Изход', en: 'Logout' },

  // Referrals
  'referrals': { bg: 'Покани Приятел', en: 'Refer a Friend' },
  'referral_applied': { bg: 'Кодът е приложен! Регистрирай се за награда.', en: 'Code applied! Sign up for reward.' },
  'referral_link_copied': { bg: 'Линкът е копиран!', en: 'Link copied!' },
  'referral_reward_toast': { bg: 'Приятел се регистрира! Спечелихте 3 дни Pro! 🎉', en: 'Friend registered! You earned 3 days of Pro! 🎉' },
  'copy': { bg: 'Копирай', en: 'Copy' },

  // Modes
  'mode_solve': { bg: 'Решаване на задачи', en: 'Problem Solving' },
  'mode_solve_desc': { bg: 'Стъпка по стъпка решения', en: 'Step-by-step solutions' },
  'mode_learn': { bg: 'Учене на тема', en: 'Learn Topic' },
  'mode_learn_desc': { bg: 'Подробни обяснения', en: 'Detailed explanations' },
  'mode_test': { bg: 'Генериране на Тест', en: 'Generate Test' },
  'mode_test_desc': { bg: 'Създай тест за класа', en: 'Create class test' },
  'mode_plan': { bg: 'Урочен План', en: 'Lesson Plan' },
  'mode_plan_desc': { bg: 'Структура на урока', en: 'Lesson structure' },
  'mode_resources': { bg: 'Ресурси & Идеи', en: 'Resources & Ideas' },
  'mode_resources_desc': { bg: 'Допълнителни материали', en: 'Extra materials' },

  // Dashboard
  'what_to_do': { bg: 'Какво ще правим днес?', en: 'What are we doing today?' },
  'teacher_tools': { bg: 'Инструменти за учителя', en: 'Teacher tools' },

  // Menu & Settings
  'settings': { bg: 'Настройки', en: 'Settings' },
  'profile': { bg: 'Профил', en: 'Profile' },
  'help': { bg: 'Помощ', en: 'Help' },
  'terms': { bg: 'Общи условия', en: 'Terms' },
  'privacy': { bg: 'Поверителност', en: 'Privacy' },
  'about_us': { bg: 'За нас', en: 'About us' },
  'contact': { bg: 'Контакти', en: 'Contact' },
  'personalization': { bg: 'Персонализация', en: 'Personalization' },
  'ai_settings': { bg: 'AI Настройки', en: 'AI Settings' },
  'data': { bg: 'Данни', en: 'Data' },
  'save_changes': { bg: 'Запази промените', en: 'Save changes' },
  'first_name': { bg: 'Име', en: 'First Name' },
  'last_name': { bg: 'Фамилия', en: 'Last Name' },
  'email': { bg: 'Имейл', en: 'Email' },
  'current_password': { bg: 'Текуща парола', en: 'Current Password' },
  'new_password': { bg: 'Нова парола', en: 'New Password' },
  'language': { bg: 'Език', en: 'Language' },
  'theme_color': { bg: 'Цвят на темата', en: 'Theme Color' },
  'dark_mode': { bg: 'Тъмен режим', en: 'Dark Mode' },
  'light_mode': { bg: 'Светъл режим', en: 'Light Mode' },
  'chat_bg': { bg: 'Фон на чата', en: 'Chat Background' },
  'remove': { bg: 'Премахни', en: 'Remove' },
  'response_length': { bg: 'Дължина на отговора', en: 'Response Length' },
  'text_size': { bg: 'Размер на текста', en: 'Text Size' },
  'delete_history_desc': { bg: 'Изтриване на цялата история на чатовете.', en: 'Delete all chat history.' },

  // Inputs
  'add_photo': { bg: 'Добави снимка', en: 'Add photo' },
  'scan': { bg: 'Сканирай', en: 'Scan' },
  'voice_input': { bg: 'Гласово въвеждане', en: 'Voice input' },
  'ai_warning': { bg: 'AI може да допуска грешки. Проверявайте важната информация.', en: 'AI can make mistakes. Check important info.' },

  // Plans
  'upgrade_plan': { bg: 'Upgrade Plan', en: 'Upgrade Plan' },
  'manage_plan': { bg: 'Управление на плана', en: 'Manage Plan' },
  'unlock_potential': { bg: 'Отключи пълния потенциал', en: 'Unlock full potential' },

  // Subject Fallbacks (Common ones, others fallback to key)
  'subject_math': { bg: 'Математика', en: 'Math' },
  'subject_bulgarian': { bg: 'Български език', en: 'Bulgarian' },
  'subject_english': { bg: 'Английски език', en: 'English' },
  'subject_history': { bg: 'История', en: 'History' },
  'subject_geography': { bg: 'География', en: 'Geography' },
  'subject_biology': { bg: 'Биология', en: 'Biology' },
  'subject_chemistry': { bg: 'Химия', en: 'Chemistry' },
  'subject_physics': { bg: 'Физика', en: 'Physics' },
};

export const t = (key: string, lang: string = 'bg'): string => {
  if (!translations[key]) {
      // Fallback for missing keys, especially subjects where we have many IDs
      if (key.startsWith('subject_')) {
          const parts = key.split('_');
          if (parts.length > 1) {
              // Capitalize first letter of the subject ID
              return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
          }
      }
      return key;
  }
  return translations[key][lang] || translations[key]['bg'] || translations[key]['en'] || key;
};
