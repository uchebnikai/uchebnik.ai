import React from 'react';
import { ArrowLeft, Mail, MapPin, Globe } from 'lucide-react';
import { SLIDE_UP, FADE_IN } from '../../animations/transitions';
import { GLASS_PANEL } from '../../styles/ui';
import { UserSettings } from '../../types';

interface PageProps {
  onBack: () => void;
  userSettings: UserSettings;
}

// Reusable Layout for all static pages to ensure design consistency
const PageLayout = ({ title, children, onBack, userSettings }: { title: string, children?: React.ReactNode, onBack: () => void, userSettings: UserSettings }) => {
  return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden w-full ${FADE_IN} bg-transparent`}>
      
      <div className={`max-w-4xl w-full mx-auto min-h-[80vh] flex flex-col items-start relative z-10 ${SLIDE_UP}`}>
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold group"
        >
          <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={18} />
          </div> 
          Назад
        </button>

        <div className={`w-full p-8 md:p-12 ${GLASS_PANEL} bg-white/70 dark:bg-black/50 backdrop-blur-2xl border-indigo-500/10 shadow-2xl`}>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight font-display">{title}</h1>
          <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-6">
            {children}
          </div>
        </div>

        <div className="w-full mt-8 text-center text-sm text-gray-400 pb-8 font-medium">
           &copy; {new Date().getFullYear()} Uchebnik AI. Всички права запазени.
        </div>
      </div>
    </div>
  );
};

export const TermsOfService = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Общи условия" onBack={onBack} userSettings={userSettings}>
    <p className="text-lg font-medium">Последна актуализация: Октомври 2023</p>
    
    <h3>1. Въведение</h3>
    <p>Добре дошли в Uchebnik AI. Използвайки нашия уебсайт и услуги, вие се съгласявате да спазвате следните общи условия. Ако не сте съгласни с някоя част от условията, моля не използвайте нашите услуги.</p>
    
    <h3>2. Използване на услугите</h3>
    <p>Вие се съгласявате да използвате Uchebnik AI само за законни образователни цели. Забранено е:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Използването на платформата за генериране на вредно или незаконно съдържание.</li>
        <li>Опитите за неоторизиран достъп до нашите системи.</li>
        <li>Споделянето на акаунти с трети лица (освен ако не е уговорено друго).</li>
    </ul>

    <h3>3. Интелектуална собственост</h3>
    <p>Цялото съдържание, включено в този сайт (код, дизайн, лога), е собственост на Uchebnik AI. Генерираното от AI съдържание принадлежи на потребителя, съгласно условията на използваните AI модели.</p>

    <h3>4. Ограничение на отговорността</h3>
    <p>Uchebnik AI е помощен инструмент. Въпреки че се стремим към точност, AI може да генерира грешна информация. Ние не носим отговорност за оценки, изпитни резултати или академични последствия от използването на платформата.</p>
  </PageLayout>
);

export const PrivacyPolicy = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Политика за поверителност" onBack={onBack} userSettings={userSettings}>
    <p>Вашата поверителност е от първостепенно значение за нас. Тази политика описва как събираме и обработваме вашите данни.</p>
    
    <h3>1. Данни, които събираме</h3>
    <p>Ние събираме информация, която ни предоставяте директно:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Име, имейл адрес и снимка (при регистрация чрез Google/Email).</li>
        <li>История на чатовете и качените изображения (за функционалността на услугата).</li>
        <li>Гласови данни (само при използване на гласовия режим, обработвани в реално време).</li>
    </ul>

    <h3>2. Как използваме вашите данни</h3>
    <p>Използваме данните единствено за:</p>
    <ul className="list-disc pl-5 space-y-2">
        <li>Предоставяне и персонализиране на AI отговорите.</li>
        <li>Подобряване на качеството на услугата.</li>
        <li>Комуникация относно актуализации на акаунта.</li>
    </ul>

    <h3>3. Сигурност</h3>
    <p>Използваме криптиране от висок клас (SSL/TLS) и сигурни бази данни (Supabase), за да защитим вашата информация от неоторизиран достъп.</p>
  </PageLayout>
);

export const CookiePolicy = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Политика за бисквитки" onBack={onBack} userSettings={userSettings}>
    <p>Ние използваме бисквитки и подобни технологии, за да подобрим вашето преживяване.</p>
    
    <h3>1. Какво са бисквитки?</h3>
    <p>Бисквитките са малки текстови файлове, които се съхраняват на вашето устройство, когато посещавате уебсайт.</p>
    
    <h3>2. Видове бисквитки, които използваме</h3>
    <ul className="list-disc pl-5 space-y-2">
        <li><strong>Задължителни:</strong> Необходими за влизане в акаунта и запазване на сесията.</li>
        <li><strong>Функционални:</strong> Запомнят вашите настройки (тема, предпочитан език).</li>
        <li><strong>Аналитични:</strong> Помагат ни да разберем как се използва сайта (анонимизирани).</li>
    </ul>
  </PageLayout>
);

export const About = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="За нас" onBack={onBack} userSettings={userSettings}>
    <div className="flex flex-col gap-6">
        <p className="text-lg font-medium leading-relaxed">
            <strong>Uchebnik AI</strong> е иновативна образователна платформа от следващо поколение, създадена с мисията да трансформира начина, по който българските ученици учат и възприемат информация.
        </p>
        <p>
            Ние вярваме, че изкуственият интелект не трябва да замества ученето, а да го прави по-интересно, персонализирано и достъпно. Нашата цел е да предоставим "суперсили" на всеки ученик и учител.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 mt-0">Нашата Мисия</h3>
                <p className="text-sm m-0">Да направим качественото образование достъпно за всеки ученик в България чрез технологии.</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20">
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 mt-0">Нашата Визия</h3>
                <p className="text-sm m-0">Бъдеще, в което всеки ученик има личен, търпелив и всезнаещ асистент 24/7.</p>
            </div>
        </div>
    </div>
  </PageLayout>
);

export const Contact = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Контакти" onBack={onBack} userSettings={userSettings}>
    <p className="text-lg">Имате въпроси, предложения или се нуждаете от помощ? Екипът ни е тук за вас.</p>
    
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-500/20 shadow-lg">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="text-indigo-500"/> Email Support
            </h3>
            <p className="text-gray-500 mb-4 text-sm">За технически въпроси и партньорства:</p>
            <a href="mailto:support@uchebnikai.com" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">support@uchebnikai.com</a>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-[#5865F2]/30 shadow-lg">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="text-[#5865F2]"/> Community
            </h3>
            <p className="text-gray-500 mb-4 text-sm">Присъединете се към нашия Discord сървър за бърза помощ:</p>
            <a href="https://discord.gg/4SB2NGPq8h" target="_blank" rel="noreferrer" className="text-[#5865F2] font-bold hover:underline">Join Discord Server</a>
        </div>
        
        <div className="col-span-1 md:col-span-2 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg flex items-start gap-4">
             <MapPin className="text-gray-400 shrink-0 mt-1"/>
             <div>
                 <h3 className="font-bold text-zinc-900 dark:text-white">Локация</h3>
                 <p className="text-gray-500 text-sm mt-1">София, България</p>
             </div>
        </div>
    </div>
  </PageLayout>
);
