
import React, { useState, useMemo } from 'react';
import { 
    ChevronLeft, ChevronRight, Plus, X, Trash2, 
    Clock, Calendar as CalendarIcon, ArrowLeft,
    CheckCircle2, Circle
} from 'lucide-react';
import { Reminder, UserSettings } from '../../types';
import { GLASS_PANEL } from '../../styles/ui';
import { SLIDE_UP, FADE_IN } from '../../animations/transitions';
import { t } from '../../utils/translations';

interface CalendarViewProps {
    onBack: () => void;
    userSettings: UserSettings;
    reminders: Reminder[];
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CalendarView = ({ onBack, userSettings, reminders, setReminders, addToast }: CalendarViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    
    // New Reminder Form State
    const [newReminderText, setNewReminderText] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('12:00');

    // Calendar Calculations
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDayOfMonth = (date: Date) => {
        const d = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        // Adjust for Monday start (0: Sun, 1: Mon...)
        return d === 0 ? 6 : d - 1;
    };

    const monthDays = useMemo(() => {
        const days = [];
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        const prevMonthDaysCount = daysInMonth(prevMonth);
        const startDay = startDayOfMonth(currentDate);

        // Fill leading empty days from prev month
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDaysCount - i,
                month: currentDate.getMonth() - 1,
                year: currentDate.getFullYear(),
                isCurrentMonth: false
            });
        }

        // Fill current month
        const count = daysInMonth(currentDate);
        for (let i = 1; i <= count; i++) {
            days.push({
                day: i,
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                isCurrentMonth: true
            });
        }

        // Fill trailing empty days for next month
        const remaining = 42 - days.length; // 6 rows of 7
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
                isCurrentMonth: false
            });
        }

        return days;
    }, [currentDate]);

    const filteredReminders = useMemo(() => {
        if (!selectedDate) return [];
        return reminders.filter(r => {
            const rDate = new Date(r.date);
            return rDate.getDate() === selectedDate.getDate() &&
                   rDate.getMonth() === selectedDate.getMonth() &&
                   rDate.getFullYear() === selectedDate.getFullYear();
        }).sort((a, b) => a.date - b.date);
    }, [reminders, selectedDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const handleAddReminder = () => {
        if (!newReminderText.trim() || !selectedDate) return;
        
        const [hours, minutes] = newReminderTime.split(':').map(Number);
        const reminderDate = new Date(selectedDate);
        reminderDate.setHours(hours, minutes, 0, 0);

        const newReminder: Reminder = {
            id: crypto.randomUUID(),
            text: newReminderText,
            date: reminderDate.getTime(),
            isCompleted: false
        };

        setReminders(prev => [...prev, newReminder]);
        setNewReminderText('');
        setShowAddModal(false);
        addToast(t('success', userSettings.language), 'success');
    };

    const handleDeleteReminder = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        addToast('Напомнянето е изтрито', 'info');
    };

    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
    };

    const monthNames = [
        "Януари", "Февруари", "Март", "Април", "Май", "Юни",
        "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"
    ];

    const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

    return (
        <div className={`flex-1 overflow-hidden flex flex-col items-center relative w-full h-full ${FADE_IN} bg-transparent p-4 md:p-8`}>
            
            <div className={`max-w-6xl w-full mx-auto h-full flex flex-col relative z-10 ${SLIDE_UP}`}>
                <button 
                    onClick={onBack} 
                    className="mb-6 flex items-center gap-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold group w-fit"
                >
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-full border border-indigo-500/10 shadow-sm group-hover:-translate-x-1 transition-transform">
                        <ArrowLeft size={18} />
                    </div> 
                    {t('back', userSettings.language)}
                </button>

                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    
                    {/* Calendar Grid Section */}
                    <div className={`flex-[1.5] ${GLASS_PANEL} p-6 flex flex-col bg-white/70 dark:bg-black/50 backdrop-blur-2xl`}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight font-display">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20}/></button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">Днес</button>
                                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20}/></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 mb-4">
                            {weekDays.map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">{d}</div>
                            ))}
                        </div>

                        <div className="flex-1 grid grid-cols-7 gap-1">
                            {monthDays.map((d, i) => {
                                const hasReminders = reminders.some(r => {
                                    const rDate = new Date(r.date);
                                    return rDate.getDate() === d.day && rDate.getMonth() === d.month && rDate.getFullYear() === d.year;
                                });
                                const isSelected = selectedDate?.getDate() === d.day && selectedDate?.getMonth() === d.month && selectedDate?.getFullYear() === d.year;
                                const isToday = new Date().getDate() === d.day && new Date().getMonth() === d.month && new Date().getFullYear() === d.year;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(new Date(d.year, d.month, d.day))}
                                        className={`relative aspect-square flex items-center justify-center rounded-2xl transition-all text-sm font-bold
                                            ${d.isCurrentMonth ? 'text-zinc-900 dark:text-white' : 'text-gray-300 dark:text-zinc-700'}
                                            ${isSelected ? 'bg-indigo-600 !text-white shadow-lg shadow-indigo-500/20 scale-105 z-10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}
                                            ${isToday && !isSelected ? 'ring-2 ring-indigo-500/50' : ''}
                                        `}
                                    >
                                        {d.day}
                                        {hasReminders && !isSelected && (
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Reminders Panel */}
                    <div className={`flex-1 flex flex-col gap-4 overflow-hidden`}>
                        <div className={`${GLASS_PANEL} p-6 flex flex-col flex-1 bg-white/70 dark:bg-black/50 backdrop-blur-2xl overflow-hidden`}>
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold">Напомняния</h3>
                                    <p className="text-xs text-gray-500 font-medium">{selectedDate?.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(true)}
                                    className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus size={20}/>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 -mx-2 px-2">
                                {filteredReminders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                                        <CalendarIcon size={48} className="mb-4" />
                                        <p className="text-sm font-medium">Няма задачи за тази дата</p>
                                    </div>
                                ) : (
                                    filteredReminders.map(r => (
                                        <div key={r.id} className={`p-4 rounded-2xl border transition-all flex items-start gap-4 group ${r.isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-indigo-500/20 shadow-sm'}`}>
                                            <button onClick={() => toggleReminder(r.id)} className={`mt-1 shrink-0 transition-colors ${r.isCompleted ? 'text-emerald-500' : 'text-gray-400 hover:text-indigo-500'}`}>
                                                {r.isCompleted ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-sm leading-snug mb-1 ${r.isCompleted ? 'line-through opacity-50' : ''}`}>
                                                    {r.text}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    <Clock size={10}/>
                                                    {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteReminder(r.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Summary Widget */}
                        <div className={`${GLASS_PANEL} p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 shrink-0`}>
                             <h4 className="font-bold text-sm mb-2 opacity-80">Общо напомняния</h4>
                             <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">{reminders.filter(r => !r.isCompleted).length}</span>
                                <span className="text-xs font-medium opacity-70">активни задачи</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Reminder Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-8 rounded-[32px] border border-indigo-500/20 shadow-2xl space-y-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Ново Напомняне</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Задача</label>
                                <textarea 
                                    autoFocus
                                    value={newReminderText}
                                    onChange={e => setNewReminderText(e.target.value)}
                                    placeholder="Какво трябва да направиш?"
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium min-h-[100px] resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Час</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                    <input 
                                        type="time"
                                        value={newReminderTime}
                                        onChange={e => setNewReminderTime(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleAddReminder}
                            disabled={!newReminderText.trim()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95"
                        >
                            Добави
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
