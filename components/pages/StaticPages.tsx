
import React from 'react';
import { ArrowLeft, Mail, MapPin, Shield, CheckCircle, AlertTriangle, Users, Heart, Zap, Globe, FileText, Lock, Server, CreditCard, ChevronRight, Cookie } from 'lucide-react';
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
          className="mb-8 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold group bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-indigo-500/10"
        >
          <div className="p-1 bg-white dark:bg-zinc-800 rounded-full shadow-sm group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={16} />
          </div> 
          Назад
        </button>

        <div className={`w-full p-8 md:p-12 ${GLASS_PANEL} bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl border-indigo-500/10 shadow-2xl rounded-[40px]`}>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight font-display border-b border-gray-200 dark:border-white/10 pb-6">
            {title}
          </h1>
          <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-8">
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
    <div className="space-y-8">
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-sm text-indigo-600 dark:text-indigo-300 flex items-center gap-3">
            <FileText size={18} />
            <span>Последна актуализация: 01 Март 2025</span>
        </div>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">1. Въведение и Приемане</h3>
            <p>
                Добре дошли в <strong>Uchebnik AI</strong>. Чрез достъпа до или използването на нашия уебсайт и услуги, вие се съгласявате да бъдете обвързани от тези Общи условия. 
                Ако не сте съгласни с някоя част от условията, нямате право да използвате услугите ни.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">2. Описание на Услугата</h3>
            <p>
                Uchebnik AI предоставя инструменти, базирани на изкуствен интелект, за помощ в образователния процес. 
                Услугите включват решаване на задачи, генериране на тестове, образователен чат, гласова комуникация и създаване на визуални материали.
            </p>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={18}/>
                <p className="text-sm text-amber-700 dark:text-amber-200/90">
                    <strong>Отказ от отговорност:</strong> Изкуственият интелект може да допуска грешки ("халюцинации"). Uchebnik AI не гарантира 100% точност на генерираното съдържание. Потребителите трябва винаги да проверяват критичната информация от надеждни източници.
                </p>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">3. Абонаменти и Плащания</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2"><CreditCard size={16} className="text-indigo-500"/> Плащания</h4>
                    <p className="text-sm">Всички транзакции се обработват сигурно чрез Stripe. Ние не съхраняваме данни за вашата карта.</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2"><Zap size={16} className="text-amber-500"/> Анулиране</h4>
                    <p className="text-sm">Можете да прекратите абонамента си по всяко време през секцията "Управление на плана". Достъпът остава активен до края на платения период.</p>
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">4. Потребителско Поведение</h3>
            <p className="mb-2">Вие се задължавате да НЕ използвате платформата за:</p>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Генериране на незаконно или вредно съдържание.</div>
                <div className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Споделяне на акаунта с трети лица.</div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">5. Интелектуална Собственост</h3>
            <p>
                Интерфейсът, логото и програмният код на Uchebnik AI са наша собственост. Съдържанието, генерирано от вас чрез AI, принадлежи на вас.
            </p>
        </section>
    </div>
  </PageLayout>
);

export const PrivacyPolicy = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Политика за поверителност" onBack={onBack} userSettings={userSettings}>
    <div className="space-y-8">
        <p className="text-lg font-medium leading-relaxed text-zinc-700 dark:text-zinc-200">
            Вашата поверителност е основен приоритет за нас. Ние се стремим към пълна прозрачност относно това как събираме и използваме вашите данни.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
                <Shield className="text-blue-500 mb-3" size={28}/>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Сигурност</h4>
                <p className="text-sm opacity-80">Криптирана връзка (SSL/TLS) и защитени бази данни.</p>
            </div>
            <div className="p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl">
                <Lock className="text-purple-500 mb-3" size={28}/>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Минимум Данни</h4>
                <p className="text-sm opacity-80">Събираме само това, което е необходимо за услугата.</p>
            </div>
            <div className="p-5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-2xl">
                <Globe className="text-green-500 mb-3" size={28}/>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Без Продажба</h4>
                <p className="text-sm opacity-80">Никога не продаваме личните ви данни на трети страни.</p>
            </div>
        </div>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Какви данни събираме?</h3>
            <ul className="space-y-3">
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Информация за акаунта:</strong> Име, имейл адрес и профилна снимка (при регистрация).
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Съдържание:</strong> История на текстовите чатове.
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Технически данни:</strong> Тип устройство и данни за използването (анализ).
                    </div>
                </li>
            </ul>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Споделяне с трети страни</h3>
            <p className="mb-3">Използваме само доверени партньори за предоставяне на услугата:</p>
            <div className="bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <span>Supabase</span>
                    <span className="text-xs font-mono bg-gray-200 dark:bg-white/10 px-2 py-1 rounded">Database & Auth</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                    <span>Stripe</span>
                    <span className="text-xs font-mono bg-gray-200 dark:bg-white/10 px-2 py-1 rounded">Payments</span>
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Вашите права</h3>
            <p>
                Имате право да поискате достъп, корекция или пълно изтриване на вашите лични данни, като се свържете с нас на <a href="mailto:support@uchebnikai.com" className="text-indigo-500 hover:underline font-bold">support@uchebnikai.com</a>.
            </p>
        </section>
    </div>
  </PageLayout>
);

export const CookiePolicy = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Политика за бисквитки" onBack={onBack} userSettings={userSettings}>
    <div className="space-y-8">
        <p className="text-lg font-medium leading-relaxed text-zinc-700 dark:text-zinc-200">
            Ние използваме бисквитки (cookies), за да подобрим вашето преживяване и да анализираме трафика.
        </p>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Какво са бисквитките?</h3>
            <p>
                Бисквитките са малки текстови файлове, които се съхраняват на вашето устройство, когато посещавате уебсайт. Те помагат на сайта да запомни вашите действия и предпочитания.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Какви бисквитки използваме?</h3>
            <ul className="space-y-3">
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Задължителни:</strong> Необходими за функционирането на сайта (напр. вход в системата).
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Аналитични:</strong> Използваме инструменти за анализ, за да разберем как посетителите взаимодействат със сайта.
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="mt-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full h-fit"><CheckCircle size={12}/></div>
                    <div>
                        <strong className="text-zinc-900 dark:text-white">Функционални:</strong> Запомнят вашите предпочитания (напр. език, тема).
                    </div>
                </li>
            </ul>
        </section>

        <section>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Управление на бисквитките</h3>
            <p>
                Можете да контролирате и/или изтривате бисквитките по всяко време чрез настройките на вашия браузър.
            </p>
        </section>
    </div>
  </PageLayout>
);

export const About = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="За нас" onBack={onBack} userSettings={userSettings}>
    <div className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-black mb-4">Образование от бъдещето</h2>
                <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
                    Uchebnik AI не е просто приложение. Това е мисия за демократизиране на качественото образование в България чрез силата на изкуствения интелект.
                </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"/>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                    <Zap size={24} fill="currentColor"/>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Иновация</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Използваме мощни AI модели за несравнима скорост и точност.</p>
            </div>
            <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                    <Heart size={24} fill="currentColor"/>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Достъпност</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Вярваме, че всеки ученик заслужава персонален учител, достъпен 24/7.</p>
            </div>
            <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4">
                    <Users size={24} fill="currentColor"/>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Общност</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Създадено от ученици за ученици. Разбираме проблемите и нуждите ви.</p>
            </div>
        </div>

        <section>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Нашата История</h3>
            <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                Проектът стартира като малка идея между трима приятели - Ваньо, Светльо и Бела. Искахме да създадем инструмент, който не просто дава отговори, а помага на учениците да разберат материала.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300">
                Днес Uchebnik AI се стреми да предостави достъпно и качествено образование за всеки, като помага на ученици и студенти да учат по-умно.
            </p>
        </section>
    </div>
  </PageLayout>
);

export const Contact = ({ onBack, userSettings }: PageProps) => (
  <PageLayout title="Контакти" onBack={onBack} userSettings={userSettings}>
    <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8">
        Имате въпроси, предложения или се нуждаете от помощ? Екипът ни е тук за вас.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose w-full">
        {/* Support Card */}
        <div className="group p-6 bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="text-indigo-600 dark:text-indigo-400" size={24}/>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Техническа поддръжка</h3>
            <p className="text-gray-500 text-sm mb-4">За проблеми с акаунта, плащания или бъгове.</p>
            <a href="mailto:support@uchebnikai.com" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                support@uchebnikai.com <ChevronRight size={16}/>
            </a>
        </div>
        
        {/* General Card */}
        <div className="group p-6 bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="text-emerald-600 dark:text-emerald-400" size={24}/>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Партньорства</h3>
            <p className="text-gray-500 text-sm mb-4">За училища, университети и бизнес запитвания.</p>
            <a href="mailto:support@uchebnikai.com" className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                support@uchebnikai.com <ChevronRight size={16}/>
            </a>
        </div>
    </div>

    <div className="w-full mt-8 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
         <div className="p-4 bg-white dark:bg-black/40 rounded-full shadow-sm">
             <MapPin className="text-zinc-400" size={24}/>
         </div>
         <div className="flex-1">
             <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Локация</h3>
             <p className="text-gray-500 text-sm mt-1">Ние сме дигитален екип, базиран в София, България. <br/>Работим дистанционно, за да сме по-близо до вас.</p>
         </div>
    </div>
  </PageLayout>
);
