
export type Language = 'bg' | 'en' | 'de' | 'es' | 'tr' | 'fr' | 'it' | 'ru' | 'zh' | 'ja' | 'ko';

export const LANGUAGES: { code: Language; label: string; countryCode: string }[] = [
  { code: 'bg', label: 'Български', countryCode: 'bg' },
  { code: 'en', label: 'English', countryCode: 'gb' },
  { code: 'de', label: 'Deutsch', countryCode: 'de' },
  { code: 'es', label: 'Español', countryCode: 'es' },
  { code: 'fr', label: 'Français', countryCode: 'fr' },
  { code: 'it', label: 'Italiano', countryCode: 'it' },
  { code: 'ru', label: 'Русский', countryCode: 'ru' },
  { code: 'tr', label: 'Türkçe', countryCode: 'tr' },
  { code: 'zh', label: '中文', countryCode: 'cn' },
  { code: 'ja', label: '日本語', countryCode: 'jp' },
  { code: 'ko', label: '한국어', countryCode: 'kr' },
];

const translations: Record<string, Record<string, string>> = {
  // General
  'hello': { 
    bg: 'Здравей', en: 'Hello', de: 'Hallo', es: 'Hola', fr: 'Bonjour', it: 'Ciao', ru: 'Привет', tr: 'Merhaba', zh: '你好', ja: 'こんにちは', ko: '안녕하세요' 
  },
  'subtitle': { 
    bg: 'Твоят личен AI учител.', en: 'Your personal AI tutor.', de: 'Dein persönlicher AI-Tutor.', es: 'Tu tutor personal de IA.', fr: 'Votre tuteur IA personnel.', it: 'Il tuo tutor AI personale.', ru: 'Ваш личный репетитор ИИ.', tr: 'Kişisel Yapay Zeka Öğretmeniniz.', zh: '您的个人AI导师。', ja: 'あなたのパーソナルAI家庭教師。', ko: '당신의 개인 AI 튜터.' 
  },
  'app_name': { 
    bg: 'Uchebnik AI', en: 'Uchebnik AI', de: 'Uchebnik AI', es: 'Uchebnik AI', fr: 'Uchebnik AI', it: 'Uchebnik AI', ru: 'Uchebnik AI', tr: 'Uchebnik AI', zh: 'Uchebnik AI', ja: 'Uchebnik AI', ko: 'Uchebnik AI' 
  },
  'ask_anything': { 
    bg: 'Попитай ме каквото и да е...', en: 'Ask me anything...', de: 'Frag mich alles...', es: 'Pregúntame lo que sea...', fr: 'Demandez-moi n\'importe quoi...', it: 'Chiedimi qualsiasi cosa...', ru: 'Спроси меня о чем угодно...', tr: 'Bana her şeyi sor...', zh: '随便问我什么...', ja: '何でも聞いてください...', ko: '무엇и든 물어보세요...' 
  },
  'error': { 
    bg: 'Възникна грешка.', en: 'An error occurred.', de: 'Ein Fehler ist aufgetreten.', es: 'Ocurrió un error.', fr: 'Une erreur est survenue.', it: 'Si è verificato un errore.', ru: 'Произошла ошибка.', tr: 'Bir hata oluşту.', zh: '发生错误。', ja: 'エラーが発生しました。', ko: '오류가 발생했습니다.' 
  },
  'delete': { 
    bg: 'Изтрий', en: 'Delete', de: 'Löschen', es: 'Eliminar', fr: 'Supprimer', it: 'Elimina', ru: 'Удалить', tr: 'Sil', zh: '删除', ja: '削除', ko: '삭제' 
  },
  'delete_all_chats': { 
    bg: 'Изтрий всички чатове', en: 'Delete all chats', de: 'Alle Chats löschen', es: 'Eliminar todos los chats', fr: 'Supprimer tous les chats', it: 'Elimina tutte le chat', ru: 'Удалить все чаты', tr: 'Tüm sohbetleri sil', zh: '删除所有聊天', ja: 'すべてのチャットを削除', ko: '모든 채팅 삭제' 
  },
  'synced': { 
    bg: 'Синхронизирано', en: 'Synced', de: 'Synchronisiert', es: 'Sincronizado', fr: 'Synchronisé', it: 'Sincronizzato', ru: 'Синхронизировано', tr: 'Eşitlendi', zh: '已同步', ja: '同期完了', ko: '동기화됨' 
  },
  'syncing': { 
    bg: 'Синхронизиране...', en: 'Syncing...', de: 'Synchronisieren...', es: 'Sincronizando...', fr: 'Synchronisation...', it: 'Sincronizzazione...', ru: 'Синхронизация...', tr: 'Eşitleniyor...', zh: '同步中...', ja: '同期中...', ko: '동기화 중...' 
  },
  'sync_error': { 
    bg: 'Грешка при синхронизация', en: 'Sync Error', de: 'Synchronisierungsfehler', es: 'Error de sincronización', fr: 'Erreur de synchronisation', it: 'Errore di sincronizzazione', ru: 'Ошибка синхронизации', tr: 'Eşitleme Hatası', zh: '同步错误', ja: '同期エラー', ko: '동기화 오류' 
  },
  'chat_general': { 
    bg: 'Общ Чат', en: 'General Chat', de: 'Allgemeiner Chat', es: 'Chat General', fr: 'Chat Général', it: 'Chat Generale', ru: 'Общий чат', tr: 'Genel Sohbet', zh: '通用聊天', ja: '一般チャット', ko: '일반 채팅' 
  },
  'new_chat': { 
    bg: 'Нов чат', en: 'New chat', de: 'Neuer Chat', es: 'Nuevo chat', fr: 'Nouveau chat', it: 'Nuova chat', ru: 'Новый чат', tr: 'Yeni sohbet', zh: '新聊天', ja: '新しいチャット', ko: '새 채팅' 
  },
  
  // Socratic Mode
  'dont_give_answer': {
    bg: 'Не ми давай отговора', en: "Don't give me the answer", de: "Gib mir nicht die Antwort", es: "No me des la respuesta", fr: "Ne me donne pas la réponse", it: "Non darmi la risposta", ru: "Не давай мне ответ", tr: "Cevabı bana verme", zh: "不要直接给我答案", ja: "答えを教えないで", ko: "정답을 알려주지 마세요"
  },
  'socratic_desc': {
    bg: 'AI ще ти помага с насоки и подсказки.', en: "AI will guide you with hints and clues.", de: "Die KI führt dich mit Hinweisen.", es: "La IA te guiará con pistas.", fr: "L'IA vous guidera avec des indices.", it: "L'IA ti guiderà con suggerimenti.", ru: "ИИ поможет подсказками.", tr: "YZ size ipuçlarıyla rehberlik edecektir.", zh: "AI 将通过提示引导你。", ja: "AIがヒントで導きます。", ko: "AI가 힌트로 안내해 드립니다."
  },

  // Navigation & Roles
  'school': { 
    bg: 'Училище', en: 'School', de: 'Schule', es: 'Escuela', fr: 'École', it: 'Scuola', ru: 'Школа', tr: 'Okul', zh: '学校', ja: '学校', ko: '학교' 
  },
  'university': { 
    bg: 'Университет', en: 'University', de: 'Universität', es: 'Universidad', fr: 'Université', it: 'Università', ru: 'Университет', tr: 'Üniversite', zh: '大学', ja: '大学', ko: '대학교' 
  },
  'students': { 
    bg: 'Ученици', en: 'Students', de: 'Schüler', es: 'Estudiantes', fr: 'Étudiants', it: 'Studenti', ru: 'Ученики', tr: 'Öğrenciler', zh: '学生', ja: '生徒', ko: '학생' 
  },
  'teachers': { 
    bg: 'Учители', en: 'Teachers', de: 'Lehrer', es: 'Profesores', fr: 'Enseignants', it: 'Insegnanti', ru: 'Учителя', tr: 'Öğretmenлер', zh: '教师', ja: '教師', ko: '교사' 
  },
  'uni_students': { 
    bg: 'Студенти', en: 'Students', de: 'Studenten', es: 'Universitarios', fr: 'Étudiants', it: 'Universitari', ru: 'Студенты', tr: 'Üniversite Öğrencileri', zh: '大学生', ja: '大学生', ko: '대학생' 
  },
  'uni_professors': { 
    bg: 'Преподаватели', en: 'Professors', de: 'Professoren', es: 'Profesores', fr: 'Professeurs', it: 'Professori', ru: 'Преподаватели', tr: 'Profesörler', zh: '教授', ja: '教授', ko: '교수' 
  },
  'select_role': { 
    bg: 'Избери роля', en: 'Select role', de: 'Rolle wählen', es: 'Seleccionar rol', fr: 'Sélectionner un rôle', it: 'Seleziona ruolo', ru: 'Выберите роль', tr: 'Rol seç', zh: '选择角色', ja: '役割を選択', ko: '역할 선택' 
  },
  'select_role_uni': { 
    bg: 'Избери роля (Университет)', en: 'Select role (University)', de: 'Rolle wählen (Uni)', es: 'Seleccionar rol (Uni)', fr: 'Sélectionner un rôle (Uni)', it: 'Seleziona ruolo (Uni)', ru: 'Выберите роль (Универ)', tr: 'Rol seç (Üni)', zh: '选择角色（大学）', ja: '役割を選択（大学）', ko: '역할 선택 (대학)' 
  },
  'role_student': { 
    bg: 'Ученик', en: 'Student', de: 'Schüler', es: 'Estudiante', fr: 'Étudiant', it: 'Studente', ru: 'Ученик', tr: 'Öğrenci', zh: '学生', ja: '生徒', ko: '학생' 
  },
  'role_teacher': { 
    bg: 'Учител', en: 'Teacher', de: 'Lehrer', es: 'Profesor', fr: 'Enseignant', it: 'Insegnante', ru: 'Учитель', tr: 'Öğretmen', zh: '教师', ja: '教師', ko: '교사' 
  },
  'role_uni_student': { 
    bg: 'Студент', en: 'Student', de: 'Student', es: 'Estudiante', fr: 'Étudiant', it: 'Studente', ru: 'Студент', tr: 'Öğrenci', zh: '学生', ja: '学生', ko: '학생' 
  },
  'role_uni_professor': { 
    bg: 'Преподавател', en: 'Professor', de: 'Professor', es: 'Profesor', fr: 'Professeur', it: 'Professore', ru: 'Преподаватель', tr: 'Profesör', zh: '教授', ja: '教授', ko: '교수' 
  },
  'desc_student': { 
    bg: 'Помощ с домашни и уроци', en: 'Help with homework and lessons', de: 'Hilfe bei Hausaufgaben', es: 'Ayuda con tareas y lecciones', fr: 'Aide aux devoirs', it: 'Aiuto con i compiti', ru: 'Помощь с домашним заданием', tr: 'Ödev yardımı', zh: '作业和课程帮助', ja: '宿題とレッスンのヘルプ', ko: '숙제 및 수업 도움말' 
  },
  'desc_teacher': { 
    bg: 'Планове, тестове и ресурси', en: 'Plans, tests and resources', de: 'Pläne, Tests und Ressourcen', es: 'Planes, pruebas y recursos', fr: 'Plans, tests et ressources', it: 'Piani, test e risorse', ru: 'Планы, тесты и ресурсы', tr: 'Planlar, testler ve kaynaklar', zh: '计划、测试和资源', ja: '計画、テスト、リソース', ko: '계획, 테스트 및 리소스' 
  },
  'desc_uni_student': { 
    bg: 'Лекции и изпити', en: 'Lectures and exams', de: 'Vorlesungen und Prüfungen', es: 'Conferencias y exámenes', fr: 'Conférences et examens', it: 'Lezioni ed esami', ru: 'Лекции и экзамены', tr: 'Dersler ve sınavlar', zh: '讲座和考试', ja: '講義と試験', ko: '강의 및 시험' 
  },
  'desc_uni_professor': { 
    bg: 'Академични материали', en: 'Academic materials', de: 'Akademische Materialien', es: 'Materiales académicos', fr: 'Matériel académique', it: 'Materiali accademici', ru: 'Академические материалы', tr: 'Akademik materyaller', zh: '学术资料', ja: '学術資料', ko: '학술 자료' 
  },
  'enter': { 
    bg: 'Вход', en: 'Enter', de: 'Eintreten', es: 'Entrar', fr: 'Entrer', it: 'Entra', ru: 'Войти', tr: 'Giriş', zh: '进入', ja: '入る', ko: '입장' 
  },
  'start': { 
    bg: 'Старт', en: 'Start', de: 'Start', es: 'Inicio', fr: 'Démarrer', it: 'Inizio', ru: 'Старт', tr: 'Başla', zh: '开始', ja: '開始', ko: '시작' 
  },
  'back': { 
    bg: 'Назад', en: 'Back', de: 'Zurück', es: 'Atrás', fr: 'Retour', it: 'Indietro', ru: 'Назад', tr: 'Geri', zh: '返回', ja: '戻る', ko: '뒤ро' 
  },
  'back_to_roles': { 
    bg: 'Към ролите', en: 'Back to roles', de: 'Zurück zu Rollen', es: 'Volver a roles', fr: 'Retour aux rôles', it: 'Torna ai ruoli', ru: 'К ролям', tr: 'Rollere dön', zh: '返回角色', ja: '役割に戻る', ko: '역할로 돌아가기' 
  },
  'select_subject': { 
    bg: 'Избери предмет', en: 'Select subject', de: 'Fach wählen', es: 'Seleccionar materia', fr: 'Sélectionner matière', it: 'Seleziona materia', ru: 'Выберите предмет', tr: 'Konu seç', zh: '选择科目', ja: '科目を選択', ko: '과목 선택' 
  },
  'choose_subject': { 
    bg: 'Избери предмет, за да започнеш.', en: 'Choose a subject to start.', de: 'Wähle ein Fach, um zu beginnen.', es: 'Elige una materia para empezar.', fr: 'Choisissez une matière pour commencer.', it: 'Scegli una materia per iniziare.', ru: 'Выберите предмет, чтобы начать.', tr: 'Başlamak için bir konu seçin.', zh: '选择一个科目开始。', ja: '開始する科目を選択してください。', ko: '시작할 과목을 선택하세요.' 
  },

  // Auth Success
  'auth_success_email_title': { 
    bg: 'Имейлът е потвърден!', en: 'Email Verified!', de: 'E-Mail bestätigt!', es: '¡Correo verificado!', fr: 'Email vérifié !', it: 'Email verificata!', ru: 'Email подтвержден!', tr: 'E-posta Doğrulandı!', zh: '电子邮件已验证！', ja: 'メール確認完了！', ko: '이메일 확인됨!' 
  },
  'auth_success_email_desc': { 
    bg: 'Вашият имейл е успешно потвърден. Акаунтът ви вече е активен.', en: 'Your email has been successfully verified. Your account is now active.', de: 'Ihre E-Mail wurde erfolgreich bestätigt. Ihr Konto ist jetzt aktiv.', es: 'Tu correo ha sido verificado con éxito. Tu cuenta ya está activa.', fr: 'Votre email a été vérifié avec succès. Votre compte est maintenant actif.', it: 'La tua email è stata verificata con successo. Il tuo account è ora attivo.', ru: 'Ваш email успешно подтвержден. Ваш аккаунт активен.', tr: 'E-postanız başarıyla doğrulandı. Hesabınız artık aktif.', zh: '您的电子邮件已成功验证。您的帐户现已激活。', ja: 'メールアドレスが正常に確認されました。アカウントは現在アクティブです。', ko: '이메일이 성공적으로 확인되었습니다. 이제 계정이 활성화되었습니다.' 
  },
  'auth_success_magic_title': { 
    bg: 'Добре дошъл отново!', en: 'Welcome back!', de: 'Willkommen zurück!', es: '¡Bienvenido de nuevo!', fr: 'Bon retour !', it: 'Bentornato!', ru: 'С возвращением!', tr: 'Tekrar hoşgeldiniz!', zh: '欢迎回来！', ja: 'お帰りなさい！', ko: '환영합니다!' 
  },
  'auth_success_magic_desc': { 
    bg: 'Успешно влязохте чрез Magic Link.', en: 'Successfully logged in via Magic Link.', de: 'Erfolgreich über Magic Link eingeloggt.', es: 'Inicio de sesión exitoso vía Magic Link.', fr: 'Connexion réussie via Magic Link.', it: 'Accesso effettuato con successo tramite Magic Link.', ru: 'Успешный вход через Magic Link.', tr: 'Magic Link ile başarıyla giriş yapıldı.', zh: '通过Magic Link成功登录。', ja: 'Magic Link経由で正常にログインしました。', ko: 'Magic Link를 통해 성공적으로 로그인했습니다.' 
  },
  'auth_success_recovery_title': { 
    bg: 'Възстановяване', en: 'Recovery', de: 'Wiederherstellung', es: 'Recuperación', fr: 'Récupération', it: 'Recupero', ru: 'Востановление', tr: 'Kurtarma', zh: '恢复', ja: '回復', ko: '복구' 
  },
  'auth_success_recovery_desc': { 
    bg: 'Сега можете да обновите паролата си.', en: 'You can now update your password.', de: 'Sie können jetzt Ihr Passwort aktualisieren.', es: 'Ahora puedes actualizar tu contraseña.', fr: 'Vous pouvez maintenant mettre à jour votre mot de passe.', it: 'Ora puoi aggiornare la tua password.', ru: 'Теперь вы можете обновить пароль.', tr: 'Şifrenizi şimdi güncelleyebilirsiniz.', zh: '您现在可以更新密码。', ja: 'パスワードを更新できます。', ko: '이제 비밀번호를 업데이트할 수 있습니다.' 
  },
  'auth_success_default_title': { 
    bg: 'Успех!', en: 'Success!', de: 'Erfolg!', es: '¡Éxito!', fr: 'Succès !', it: 'Successo!', ru: 'Успех!', tr: 'Başarılı!', zh: '成功！', ja: '成功！', ko: '성공!' 
  },
  'auth_success_default_desc': { 
    bg: 'Действието е изпълнено успешно.', en: 'Action completed successfully.', de: 'Aktion erfolgreich abgeschlossen.', es: 'Acción completada con éxito.', fr: 'Action terminée avec succès.', it: 'Azione completata con successo.', ru: 'Действие выполнено успешно.', tr: 'İşlem başarıyla tamamlandı.', zh: '操作成功完成。', ja: 'アクションが正常に完了しました。', ko: '작업이 성공적으로 완료되었습니다.' 
  },
  'continue_to_app': { 
    bg: 'Към приложението', en: 'Continue to App', de: 'Weiter zur App', es: 'Continuar a la aplicación', fr: 'Continuer vers l\'application', it: 'Continua nell\'app', ru: 'Перейти в приложение', tr: 'Uygulamaya Devam Et', zh: '继续前往应用程序', ja: 'アプリに進む', ko: '앱으로 계속' 
  },
  'login': { 
    bg: 'Вход', en: 'Login', de: 'Anmelden', es: 'Iniciar sesión', fr: 'Connexion', it: 'Accedi', ru: 'Вход', tr: 'Giriş', zh: '登录', ja: 'ログイン', ko: '로그인' 
  },
  'logout': { 
    bg: 'Изход', en: 'Logout', de: 'Abmelden', es: 'Cerrar sesión', fr: 'Déconnexion', it: 'Esci', ru: 'Выход', tr: 'Çıkış', zh: '注销', ja: 'ログアウト', ko: '로그아웃' 
  },

  // Referrals
  'referrals': { 
    bg: 'Покани Приятел', en: 'Refer a Friend', de: 'Freund einladen', es: 'Recomendar amigo', fr: 'Parrainer un ami', it: 'Invita un amico', ru: 'Пригласить друга', tr: 'Arkadaşını Davet Et', zh: '推荐朋友', ja: '友達を紹介', ko: '친구 추천' 
  },
  'referral_applied': { 
    bg: 'Кодът е приложен! Регистрирай се за награда.', en: 'Code applied! Sign up for reward.', de: 'Code angewendet! Registrieren für Belohnung.', es: '¡Código aplicado! Regístrate para recompensa.', fr: 'Code appliqué ! Inscrivez-vous pour la récompense.', it: 'Codice applicato! Iscriviti per la ricompensa.', ru: 'Код применен! Регистрация для награды.', tr: 'Kod uygulandı! Ödül için kaydol.', zh: '代码已应用！注册以获取奖励。', ja: 'コードが適用されました！報酬のためにサインアップしてください。', ko: '코드가 적용되었습니다! 보상을 위해 가입하세요.' 
  },
  'referral_link_copied': { 
    bg: 'Линкът е копиран!', en: 'Link copied!', de: 'Link kopiert!', es: '¡Enlace copiado!', fr: 'Lien copié !', it: 'Link copiato!', ru: 'Ссылка скопирована!', tr: 'Bağlantı kopyalandı!', zh: '链接已复制！', ja: 'リンクがコピーされました！', ko: '링크가 복사되었습니다!' 
  },
  'referral_reward_toast': { 
    bg: 'Приятел се регистрира! Спечелихте 3 дни Pro! 🎉', en: 'Friend registered! You earned 3 days of Pro! 🎉', de: 'Freund registriert! 3 Tage Pro verdient! 🎉', es: '¡Amigo registrado! ¡Ganaste 3 días de Pro! 🎉', fr: 'Ami inscrit ! Vous avez gagné 3 jours de Pro ! 🎉', it: 'Amico registrato! Hai guadagnato 3 giorni di Pro! 🎉', ru: 'Друг зарегистрировался! Вы получили 3 дня Pro! 🎉', tr: 'Arkadaş kaydedildi! 3 gün Pro kazandınız! 🎉', zh: '朋友已注册！您赢得了3天Pro！🎉', ja: '友達が登録しました！Proを3日間獲得しました！🎉', ko: '친구가 등록했습니다! Pro 3일을 획득했습니다! 🎉' 
  },
  'copy': { 
    bg: 'Копирай', en: 'Copy', de: 'Kopieren', es: 'Copiar', fr: 'Copier', it: 'Copia', ru: 'Копировать', tr: 'Kopyala', zh: '复制', ja: 'コピー', ko: '복사' 
  },

  // Modes
  'mode_solve': { 
    bg: 'Решаване на задачи', en: 'Problem Solving', de: 'Problemlösung', es: 'Resolución de problemas', fr: 'Résolution de problèmes', it: 'Risoluzione problemi', ru: 'Решение задач', tr: 'Problem Çözme', zh: '解决问题', ja: '問題解決', ko: '문제 해결' 
  },
  'mode_solve_desc': { 
    bg: 'Стъпка по стъпка решения', en: 'Step-by-step solutions', de: 'Schritt-für-Schritt-Lösungen', es: 'Soluciones paso a paso', fr: 'Solutions étape par étape', it: 'Soluzioni passo dopo passo', ru: 'Пошаговые решения', tr: 'Adım adım çözümler', zh: '逐步解决方案', ja: 'ステップバイステップの解決策', ko: '단계별 솔루션' 
  },
  'mode_learn': { 
    bg: 'Учене на тема', en: 'Learn Topic', de: 'Thema lernen', es: 'Aprender tema', fr: 'Apprendre un sujet', it: 'Impara argomento', ru: 'Изучение темы', tr: 'Konu Öğрен', zh: '学习主题', ja: 'トピックを学ぶ', ko: '주제 학습' 
  },
  'mode_learn_desc': { 
    bg: 'Подробни обяснения', en: 'Detailed explanations', de: 'Detaillierte Erklärungen', es: 'Explicaciones detalladas', fr: 'Explications détaillées', it: 'Spiegazioni dettagliate', ru: 'Подробные объяснения', tr: 'Detaylı açıklamalar', zh: '详细解释', ja: '詳細な説明', ko: '자세한 설명' 
  },
  'mode_test': { 
    bg: 'Генериране на Тест', en: 'Generate Test', de: 'Test generieren', es: 'Generar prueba', fr: 'Générer un test', it: 'Genera test', ru: 'Создать тест', tr: 'Test Oluştur', zh: '生成测试', ja: 'テストを生成', ko: '테스트 생성' 
  },
  'mode_test_desc': { 
    bg: 'Създай тест за класа', en: 'Create class test', de: 'Klassentest erstellen', es: 'Crear prueba de clase', fr: 'Créer un test de classe', it: 'Crea test di classe', ru: 'Создать тест для класса', tr: 'Sınıf testi oluştur', zh: '创建课堂测试', ja: 'クラステストを作成', ko: '학급 테스트 만들기' 
  },
  'mode_plan': { 
    bg: 'Урочен План', en: 'Lesson Plan', de: 'Lehrplan', es: 'Plan de lección', fr: 'Plan de leçon', it: 'Piano lezione', ru: 'План урока', tr: 'Ders Planı', zh: '课程计划', ja: 'レッスンプラン', ko: '수업 계획' 
  },
  'mode_plan_desc': { 
    bg: 'Структура на урока', en: 'Lesson structure', de: 'Lektionsstruktur', es: 'Estructura de la lección', fr: 'Structure de la leçon', it: 'Struttura della lezione', ru: 'Структура урока', tr: 'Ders yapısı', zh: '课程结构', ja: 'レッスン構成', ko: '수업 구조' 
  },
  'mode_resources': { 
    bg: 'Ресурси & Идеи', en: 'Resources & Ideas', de: 'Ressourcen & Ideen', es: 'Recursos e ideas', fr: 'Ressources et idées', it: 'Risorse e idee', ru: 'Ресурсы и идеи', tr: 'Kaynaklar ve Fikirler', zh: '资源与创意', ja: 'リソースとアイデア', ko: '리소스 및 아이디어' 
  },
  'mode_resources_desc': { 
    bg: 'Допълнителни материали', en: 'Extra materials', de: 'Zusatzmaterialien', es: 'Materiales extra', fr: 'Matériel supplémentaire', it: 'Materiali extra', ru: 'Доп. материалы', tr: 'Ekstra materyaller', zh: '额外材料', ja: '追加資料', ko: '추가 자료' 
  },

  // Dashboard
  'what_to_do': { 
    bg: 'Какво ще правим днес?', en: 'What are we doing today?', de: 'Was machen wir heute?', es: '¿Qué hacemos hoy?', fr: 'Que faisons-nous aujourd\'hui ?', it: 'Cosa facciamo oggi?', ru: 'Чем займемся сегодня?', tr: 'Bugün ne yapıyoruz?', zh: '今天做什么？', ja: '今日は何をしますか？', ko: '오늘은 무엇을 할까요?' 
  },
  'teacher_tools': { 
    bg: 'Инструменти за учителя', en: 'Teacher tools', de: 'Lehrer-Tools', es: 'Herramientas para profesores', fr: 'Outils pour enseignants', it: 'Strumenti per insegnanti', ru: 'Инструменты учителя', tr: 'Öğretmen araçları', zh: '教师工具', ja: '教師用ツール', ko: '교사 도구' 
  },

  // Menu & Settings
  'settings': { 
    bg: 'Настройки', en: 'Settings', de: 'Einstellungen', es: 'Ajustes', fr: 'Paramètres', it: 'Impostazioni', ru: 'Настройки', tr: 'Ayarlar', zh: '设置', ja: '設定', ko: '설정' 
  },
  'profile': { 
    bg: 'Профил', en: 'Profile', de: 'Profil', es: 'Perfil', fr: 'Profil', it: 'Profilo', ru: 'Профиль', tr: 'Profil', zh: '个人资料', ja: 'プロフィール', ko: '프로필' 
  },
  'help': { 
    bg: 'Помощ', en: 'Help', de: 'Hilfe', es: 'Ayuda', fr: 'Aide', it: 'Aiuto', ru: 'Помощь', tr: 'Yardım', zh: '帮助', ja: 'ヘルプ', ko: '도움말' 
  },
  'terms': { 
    bg: 'Общи условия', en: 'Terms', de: 'AGB', es: 'Términos', fr: 'Conditions', it: 'Termini', ru: 'Условия', tr: 'Şartlar', zh: '条款', ja: '利用規約', ko: '약관' 
  },
  'privacy': { 
    bg: 'Поверителност', en: 'Privacy', de: 'Datenschutz', es: 'Privacidad', fr: 'Confidentialité', it: 'Privacy', ru: 'Конфиденциальность', tr: 'Gizlilik', zh: '隐私', ja: 'プライバシー', ko: '개인정보' 
  },
  'about_us': { 
    bg: 'За нас', en: 'About us', de: 'Über uns', es: 'Sobre nosotros', fr: 'À propos', it: 'Chi siamo', ru: 'О нас', tr: 'Hakkımızda', zh: '关于我们', ja: '私たちについて', ko: '회사 소개' 
  },
  'contact': { 
    bg: 'Контакти', en: 'Contact', de: 'Kontakt', es: 'Contacto', fr: 'Contact', it: 'Contatto', ru: 'Контакты', tr: 'İletişim', zh: '联系', ja: '連絡先', ko: '연락처' 
  },
  'personalization': { 
    bg: 'Персонализация', en: 'Personalization', de: 'Personalisierung', es: 'Personalización', fr: 'Personnalisation', it: 'Personalizzazione', ru: 'Персонализация', tr: 'Kişiselleştirme', zh: '个性化', ja: 'パーソナライズ', ko: '개인화' 
  },
  'ai_settings': { 
    bg: 'AI Настройки', en: 'AI Settings', de: 'AI-Einstellungen', es: 'Ajustes de IA', fr: 'Paramètres IA', it: 'Impostazioni AI', ru: 'Настройки ИИ', tr: 'YZ Ayarları', zh: 'AI设置', ja: 'AI設定', ko: 'AI 설정' 
  },
  'data': { 
    bg: 'Данни', en: 'Data', de: 'Daten', es: 'Datos', fr: 'Données', it: 'Dati', ru: 'Данные', tr: 'Veri', zh: '数据', ja: '数据', ko: '데이터' 
  },
  'save_changes': { 
    bg: 'Запази промените', en: 'Save changes', de: 'Änderungen speichern', es: 'Guardar cambios', fr: 'Sauvegarder', it: 'Salva modifiche', ru: 'Сохранить', tr: 'Değişiklikleri kaydet', zh: '保存更改', ja: '変更を保存', ko: '변경 사항 저장' 
  },
  'first_name': { 
    bg: 'Име', en: 'First Name', de: 'Vorname', es: 'Nombre', fr: 'Prénom', it: 'Nome', ru: 'Имя', tr: 'Ad', zh: '名字', ja: '名', ko: '이름' 
  },
  'last_name': { 
    bg: 'Фамилия', en: 'Last Name', de: 'Nachname', es: 'Apellido', fr: 'Nom', it: 'Cognome', ru: 'Фамилия', tr: 'Soyad', zh: '姓氏', ja: '姓', ko: '성' 
  },
  'email': { 
    bg: 'Имейл', en: 'Email', de: 'E-Mail', es: 'Correo', fr: 'Email', it: 'Email', ru: 'Email', tr: 'E-posta', zh: '电子邮件', ja: 'メール', ko: '이메일' 
  },
  'current_password': { 
    bg: 'Текуща парола', en: 'Current Password', de: 'Aktuelles Passwort', es: 'Contraseña actual', fr: 'Mot de passe actuel', it: 'Password attuale', ru: 'Текущий пароль', tr: 'Mevcut Şifre', zh: '当前密码', ja: '現在のパスワード', ko: '현재 비밀번호' 
  },
  'new_password': { 
    bg: 'Нова парола', en: 'New Password', de: 'Neues Passwort', es: 'Nueva contraseña', fr: 'Nouveau mot de passe', it: 'Nuova password', ru: 'Новый пароль', tr: 'Yeni Şifre', zh: '新密码', ja: '新しいパスワード', ko: '새 비밀번호' 
  },
  'language': { 
    bg: 'Език', en: 'Language', de: 'Sprache', es: 'Idioma', fr: 'Langue', it: 'Lingua', ru: 'Язык', tr: 'Dil', zh: '语言', ja: '言語', ko: '언어' 
  },
  'theme_color': { 
    bg: 'Цвят на темата', en: 'Theme Color', de: 'Themenfarbe', es: 'Color del tema', fr: 'Couleur du thème', it: 'Colore tema', ru: 'Цвет темы', tr: 'Tema Rengi', zh: '主题颜色', ja: 'テーマカラー', ko: '테마 색상' 
  },
  'dark_mode': { 
    bg: 'Тъмен режим', en: 'Dark Mode', de: 'Dunkelmodus', es: 'Modo oscuro', fr: 'Mode sombre', it: 'Modalità scura', ru: 'Темный режим', tr: 'Karanlık Mod', zh: '深色模式', ja: 'ダークモード', ko: '다크 모드' 
  },
  'light_mode': { 
    bg: 'Светъл режим', en: 'Light Mode', de: 'Heller Modus', es: 'Modo claro', fr: 'Mode clair', it: 'Modalità chiara', ru: 'Светлый режим', tr: 'Aydınlık Mod', zh: '浅色模式', ja: 'ライトモード', ko: '라이트 모드' 
  },
  'chat_bg': { 
    bg: 'Фон на чата', en: 'Chat Background', de: 'Chathintergrund', es: 'Fondo de chat', fr: 'Fond de chat', it: 'Sfondo chat', ru: 'Фон чата', tr: 'Sohbet Arka Planı', zh: '聊天背景', ja: 'チャットの背景', ko: '채팅 배경' 
  },
  'remove': { 
    bg: 'Премахни', en: 'Remove', de: 'Entfernen', es: 'Eliminar', fr: 'Supprimer', it: 'Rimuovi', ru: 'Удалить', tr: 'Kaldır', zh: '移除', ja: '削除', ko: '제거' 
  },
  'response_length': { 
    bg: 'Дължина на отговора', en: 'Response Length', de: 'Antwortlänge', es: 'Longitud de respuesta', fr: 'Longueur de réponse', it: 'Lunghezza risposta', ru: 'Длина ответа', tr: 'Yanıt Uzunluğu', zh: '回答长度', ja: '回答の長さ', ko: '응답 길이' 
  },
  'text_size': { 
    bg: 'Размер на текста', en: 'Text Size', de: 'Textgröße', es: 'Tamaño del texto', fr: 'Taille du texte', it: 'Dimensione testo', ru: 'Размер текста', tr: 'Metin Boyutu', zh: '文字大小', ja: '文字サイズ', ko: '텍스트 크기' 
  },
  'delete_history_desc': { 
    bg: 'Изтриване на цялата история на чатовете.', en: 'Delete all chat history.', de: 'Gesamten Chatverlauf löschen.', es: 'Eliminar todo el historial de chat.', fr: 'Supprimer tout l\'historique des chats.', it: 'Elimina tutta la cronologia chat.', ru: 'Удалить всю историю чатов.', tr: 'Tüm sohbet geçmişini sil.', zh: '删除所有聊天记录。', ja: 'すべてのチャット履歴を削除します。', ko: '모든 채팅 기록을 삭제합니다.' 
  },

  // Inputs
  'add_photo': { 
    bg: 'Добави снимка', en: 'Add photo', de: 'Foto hinzufügen', es: 'Añadir foto', fr: 'Ajouter photo', it: 'Aggiungi foto', ru: 'Добавить фото', tr: 'Fotoğraf ekle', zh: '添加照片', ja: '写真を追加', ko: '사진 추가' 
  },
  'scan': { 
    bg: 'Сканирай', en: 'Scan', de: 'Scannen', es: 'Escanear', fr: 'Scanner', it: 'Scansiona', ru: 'Сканировать', tr: 'Tara', zh: '扫描', ja: 'スキャン', ko: 'ス캔' 
  },
  'voice_input': { 
    bg: 'Гласово въвеждане', en: 'Voice input', de: 'Spracheingabe', es: 'Entrada de voz', fr: 'Entrée vocale', it: 'Input vocale', ru: 'Голосовой ввод', tr: 'Sesli giriş', zh: '语音输入', ja: '音声入力', ko: '음성 입력' 
  },
  'ai_warning': { 
    bg: 'AI може да допуска грешки. Проверявайте важната информация.', en: 'AI can make mistakes. Check important info.', de: 'KI kann Fehler machen. Überprüfen Sie wichtige Infos.', es: 'La IA puede cometer errores. Verifique info importante.', fr: 'L\'IA peut faire des erreurs. Vérifiez les infos.', it: 'L\'IA può commettere errori. Verifica le info importanti.', ru: 'ИИ может ошибаться. Проверяйте информацию.', tr: 'YZ hata yapabilir. Önemli bilgileri kontrol edin.', zh: 'AI可能会犯错。请核实重要信息。', ja: 'AIは間違いを犯す可能性があります。重要な情報を确认してください。', ko: 'AI는 실수를 할 수 있습니다. 중요한 정보를 확인하세요.' 
  },

  // Plans
  'upgrade_plan': { 
    bg: 'Upgrade Plan', en: 'Upgrade Plan', de: 'Plan upgraden', es: 'Mejorar plan', fr: 'Mettre à jour le plan', it: 'Aggiorna piano', ru: 'Улучшить план', tr: 'Planı Yükselt', zh: '升级计划', ja: 'プランをアップグレード', ko: '플랜 업그레이드' 
  },
  'manage_plan': { 
    bg: 'Управление на плана', en: 'Manage Plan', de: 'Plan verwalten', es: 'Gestionar plan', fr: 'Gérer le plan', it: 'Gestisci piano', ru: 'Управление планом', tr: 'Planı Yönet', zh: '管理计划', ja: 'プランの管理', ko: '플랜 관리' 
  },
  'unlock_potential': { 
    bg: 'Отключи пълния потенциал', en: 'Unlock full potential', de: 'Volles Potenzial freischalten', es: 'Desbloquear todo el potencial', fr: 'Libérez tout le potentiel', it: 'Sblocca tutto il potenziale', ru: 'Раскройте полный потенциал', tr: 'Tam potansiyeli aç', zh: '释放全部潜力', ja: '潜在能力を最大限に引き出す', ko: '잠재력을 최대한 발휘하세요' 
  },

  // Subjects - School
  'subject_math': { 
    bg: 'Математика', en: 'Math', de: 'Mathe', es: 'Matemáticas', fr: 'Maths', it: 'Matematica', ru: 'Математика', tr: 'Matematik', zh: '数学', ja: '数学', ko: '수학' 
  },
  'subject_bulgarian': { 
    bg: 'Български език', en: 'Bulgarian', de: 'Bulgarisch', es: 'Búlgaro', fr: 'Bulgare', it: 'Bulgaro', ru: 'Болгарский', tr: 'Bulgarca', zh: '保加利亚语', ja: 'ブルガリア語', ko: '불가리아어' 
  },
  'subject_english': { 
    bg: 'Английски език', en: 'English', de: 'Englisch', es: 'Inglés', fr: 'Anglais', it: 'Inglese', ru: 'Английский', tr: 'İngilizce', zh: '英语', ja: '英語', ko: '영어' 
  },
  'subject_german': { 
    bg: 'Немски език', en: 'German', de: 'Deutsch', es: 'Alemán', fr: 'Allemand', it: 'Tedesco', ru: 'Немецкий', tr: 'Almanca', zh: '德语', ja: 'ドイツ語', ko: '독일어' 
  },
  'subject_russian': { 
    bg: 'Руски език', en: 'Russian', de: 'Russisch', es: 'Ruso', fr: 'Russe', it: 'Russo', ru: 'Русский', tr: 'Rusça', zh: '俄语', ja: 'ロシア語', ko: '러시아어' 
  },
  'subject_french': { 
    bg: 'Френски език', en: 'French', de: 'Französisch', es: 'Francés', fr: 'Français', it: 'Francese', ru: 'Французский', tr: 'Fransızca', zh: '法语', ja: 'フランス語', ko: '프랑с어' 
  },
  'subject_spanish': { 
    bg: 'Испански език', en: 'Spanish', de: 'Spanisch', es: 'Español', fr: 'Espagnol', it: 'Spagnolo', ru: 'Испанский', tr: 'İspanyolca', zh: '西班牙语', ja: 'スペイン語', ko: '스페인어' 
  },
  'subject_physics': { 
    bg: 'Физика', en: 'Physics', de: 'Physik', es: 'Física', fr: 'Physique', it: 'Fisica', ru: 'Физика', tr: 'Fizik', zh: '物理', ja: '物理', ko: '물리학' 
  },
  'subject_chemistry': { 
    bg: 'Химия', en: 'Chemistry', de: 'Chemie', es: 'Química', fr: 'Chimie', it: 'Chimica', ru: 'Химия', tr: 'Kimya', zh: '化学', ja: '化学', ko: '화학' 
  },
  'subject_biology': { 
    bg: 'Биология', en: 'Biology', de: 'Biologie', es: 'Biología', fr: 'Biologie', it: 'Biologia', ru: 'Биология', tr: 'Biyoloji', zh: '生物', ja: '生物', ko: '생물학' 
  },
  'subject_history': { 
    bg: 'История', en: 'History', de: 'Geschichte', es: 'Historia', fr: 'Histoire', it: 'Storia', ru: 'История', tr: 'Tarih', zh: '历史', ja: '歴史', ko: '역사' 
  },
  'subject_geography': { 
    bg: 'География', en: 'Geography', de: 'Geografie', es: 'Geografía', fr: 'Géographie', it: 'Geografia', ru: 'География', tr: 'Coğrafya', zh: '地理', ja: '地理', ko: '지리학' 
  },
  'subject_music': { 
    bg: 'Музика', en: 'Music', de: 'Musik', es: 'Música', fr: 'Musique', it: 'Musica', ru: 'Музыка', tr: 'Müzik', zh: '音乐', ja: '音楽', ko: '음악' 
  },
  'subject_japanese': { 
    bg: 'Японски език', en: 'Japanese', de: 'Japanisch', es: 'Japonés', fr: 'Japonais', it: 'Giapponese', ru: 'Японский', tr: 'Japonca', zh: '日语', ja: '日本語', ko: '일본어' 
  },
  'subject_it': { 
    bg: 'Информатика', en: 'IT', de: 'Informatik', es: 'Informática', fr: 'Informatique', it: 'Informatica', ru: 'Информатика', tr: 'Bilişim', zh: '信息技术', ja: '情報技術', ko: 'IT' 
  },
  'subject_technologies': { 
    bg: 'Технологии', en: 'Technologies', de: 'Technologien', es: 'Tecnologías', fr: 'Technologies', it: 'Tecnologie', ru: 'Технологии', tr: 'Teknolojiler', zh: '技术', ja: '技術', ko: '기술' 
  },
  'subject_philosophy': { 
    bg: 'Философия', en: 'Philosophy', de: 'Philosophie', es: 'Filosofía', fr: 'Philosophie', it: 'Filosofia', ru: 'Философия', tr: 'Felsefe', zh: '哲学', ja: '哲学', ko: '철학' 
  },
  'subject_citizenship': { 
    bg: 'Гражданско', en: 'Citizenship', de: 'Staatsbürgerkunde', es: 'Ciudadanía', fr: 'Éducation civique', it: 'Educazione civica', ru: 'Граждановедение', tr: 'Vatandaşlık', zh: '公民教育', ja: '公民', ko: '시민 교육' 
  },
  'subject_religion': { 
    bg: 'Религия', en: 'Religion', de: 'Religion', es: 'Religión', fr: 'Religion', it: 'Religione', ru: 'Религия', tr: 'Din', zh: '宗教', ja: '宗教', ko: '종교' 
  },
  'subject_art': { 
    bg: 'Изкуство', en: 'Art', de: 'Kunst', es: 'Arte', fr: 'Art', it: 'Arte', ru: 'Искусство', tr: 'Sanat', zh: '艺术', ja: '芸術', ko: '예술' 
  },
  'subject_pe': { 
    bg: 'Спорт', en: 'Sport', de: 'Sport', es: 'Deporte', fr: 'Sport', it: 'Sport', ru: 'Спорт', tr: 'Spor', zh: '体育', ja: 'スポーツ', ko: '스포츠' 
  },

  // Subjects - University
  'subject_higher_math': { 
    bg: 'Висша Математика', en: 'Higher Math', de: 'Höhere Mathematik', es: 'Matemáticas superiores', fr: 'Mathématiques supérieures', it: 'Matematica superiore', ru: 'Высшая математика', tr: 'İleri Matematik', zh: '高等数学', ja: '高等数学', ko: '고등 수학' 
  },
  'subject_computer_science': { 
    bg: 'Компютърни Науки', en: 'Computer Science', de: 'Informatik', es: 'Ciencias de la Computación', fr: 'Informatique', it: 'Informatica', ru: 'Информатика', tr: 'Bilgisayar Bilimi', zh: '计算机科学', ja: 'コンピュータサイエンス', ko: '컴퓨터 과학' 
  },
  'subject_economics': { 
    bg: 'Икономика', en: 'Economics', de: 'Wirtschaft', es: 'Economía', fr: 'Économie', it: 'Economia', ru: 'Экономика', tr: 'Ekonomi', zh: '经济学', ja: '经济学', ko: '경제학' 
  },
  'subject_finance': { 
    bg: 'Финанси', en: 'Finance', de: 'Finanzen', es: 'Finanzas', fr: 'Finance', it: 'Finanza', ru: 'Финансы', tr: 'Finans', zh: '金融', ja: '金融', ko: '금융' 
  },
  'subject_management': { 
    bg: 'Мениджмънт', en: 'Management', de: 'Management', es: 'Gestión', fr: 'Gestion', it: 'Gestione', ru: 'Менеджмент', tr: 'Yönetim', zh: '管理', ja: '経営', ko: '경영' 
  },
  'subject_law': { 
    bg: 'Право', en: 'Law', de: 'Jura', es: 'Derecho', fr: 'Droit', it: 'Legge', ru: 'Право', tr: 'Hukuk', zh: '法律', ja: '法律', ko: '법학' 
  },
  'subject_medicine': { 
    bg: 'Медицина', en: 'Medicine', de: 'Medizin', es: 'Medicina', fr: 'Médecine', it: 'Medicina', ru: 'Медицина', tr: 'Tıp', zh: '医学', ja: '医学', ko: '의학' 
  },
  'subject_dental_medicine': { 
    bg: 'Дентална Медицина', en: 'Dental Medicine', de: 'Zahnmedizin', es: 'Odontología', fr: 'Médecine dentaire', it: 'Odontoiatria', ru: 'Стоматология', tr: 'Diş Hekimliği', zh: '牙科医学', ja: '歯科医学', ko: '치의학' 
  },
  'subject_pharmacy': { 
    bg: 'Фармация', en: 'Pharmacy', de: 'Pharmazie', es: 'Farmacia', fr: 'Pharmacie', it: 'Farmacia', ru: 'Фармация', tr: 'Eczacılık', zh: '药学', ja: '薬学', ko: '약학' 
  },
  'subject_veterinary_medicine': { 
    bg: 'Ветеринарна Медицина', en: 'Veterinary Medicine', de: 'Tiermedizin', es: 'Medicina Veterinaria', fr: 'Médecine vétérinaire', it: 'Medicina Veterinaria', ru: 'Ветеринария', tr: 'Veterinerlik', zh: '兽医学', ja: '獣医学', ko: '수의학' 
  },
  'subject_engineering': { 
    bg: 'Инженерство', en: 'Engineering', de: 'Ingenieurwesen', es: 'Ingeniería', fr: 'Ingénierie', it: 'Ingegneria', ru: 'Инженерия', tr: 'Mühendislik', zh: '工程', ja: '工学', ko: '공학' 
  },
  'subject_architecture': { 
    bg: 'Архитектура', en: 'Architecture', de: 'Architektur', es: 'Arquitectura', fr: 'Architecture', it: 'Architettura', ru: 'Архитектура', tr: 'Mimarlık', zh: '建筑学', ja: '建築', ko: '건축' 
  },
  'subject_psychology': { 
    bg: 'Психология', en: 'Psychology', de: 'Psychologie', es: 'Psicología', fr: 'Psychologie', it: 'Psicologia', ru: 'Психология', tr: 'Psikoloji', zh: '心理学', ja: '心理学', ko: '심리학' 
  },
  'subject_pedagogy': { 
    bg: 'Педагогика', en: 'Pedagogy', de: 'Pädagogik', es: 'Pedagogía', fr: 'Pédagogie', it: 'Pedagogia', ru: 'Педагогика', tr: 'Pedagoji', zh: '教育学', ja: '教育学', ko: '교육학' 
  },
  'subject_marketing': { 
    bg: 'Маркетинг', en: 'Marketing', de: 'Marketing', es: 'Marketing', fr: 'Marketing', it: 'Marketing', ru: 'Маркетинг', tr: 'Pazarlama', zh: '市场营销', ja: '마케팅', ko: '마케팅' 
  },
  'subject_journalism': { 
    bg: 'Журналистика', en: 'Journalism', de: 'Journalismus', es: 'Periodismo', fr: 'Journalisme', it: 'Giornalismo', ru: 'Журналистика', tr: 'Gazetecilik', zh: '新闻学', ja: 'ジャーナリズム', ko: '저널리즘' 
  },
  'subject_political_science': { 
    bg: 'Политология', en: 'Political Science', de: 'Politikwissenschaft', es: 'Ciencias Políticas', fr: 'Sciences politiques', it: 'Scienze Politiche', ru: 'Политология', tr: 'Siyaset Bilimi', zh: '政治学', ja: '政治学', ko: '정치학' 
  },
  'subject_int_relations': { 
    bg: 'М. Отношения', en: 'Int. Relations', de: 'Int. Beziehungen', es: 'Relaciones Int.', fr: 'Relations Int.', it: 'Relazioni Int.', ru: 'Междунар. отношения', tr: 'Uluslararası İlişkiler', zh: '国际关系', ja: '国際関係', ko: '국제 관계' 
  },
  'subject_sociology': { 
    bg: 'Социология', en: 'Sociology', de: 'Soziologie', es: 'Sociología', fr: 'Sociologie', it: 'Sociologia', ru: 'Социология', tr: 'Sosyoloji', zh: '社会学', ja: '社会学', ko: '사회학' 
  },
  'subject_statistics': { 
    bg: 'Статистика', en: 'Statistics', de: 'Statistik', es: 'Estadística', fr: 'Statistiques', it: 'Statistica', ru: 'Статистика', tr: 'İstatistik', zh: '统计学', ja: '統計学', ko: '통계학' 
  },
  'subject_ecology': { 
    bg: 'Екология', en: 'Ecology', de: 'Ökologie', es: 'Ecología', fr: 'Écologie', it: 'Ecologia', ru: 'Экология', tr: 'Ekoloji', zh: '生态学', ja: '生態学', ko: '생태학' 
  },
  'subject_tourism': { 
    bg: 'Туризъм', en: 'Tourism', de: 'Tourismus', es: 'Turismo', fr: 'Tourisme', it: 'Turismo', ru: 'Туризм', tr: 'Turizm', zh: '旅游', ja: '観光', ko: '관광' 
  },
};

export const t = (key: string, lang: string = 'bg'): string => {
  if (!translations[key]) {
      // Fallback for missing keys
      if (key.startsWith('subject_')) {
          const parts = key.split('_');
          if (parts.length > 1) {
              // Attempt to prettify the ID if no translation found
              return parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          }
      }
      return key;
  }
  // Try selected language -> Try English -> Try Bulgarian -> Return Key
  return translations[key][lang] || translations[key]['en'] || translations[key]['bg'] || key;
};
