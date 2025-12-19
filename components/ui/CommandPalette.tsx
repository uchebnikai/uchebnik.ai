
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Zap, Book, Settings, User, CreditCard, Clock, Sun, Moon, Volume2, Globe } from 'lucide-react';
import { SubjectConfig, SubjectId, HomeViewType } from '../../types';
import { SUBJECTS } from '../../constants';
import { DynamicIcon } from './DynamicIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  setActiveSubject: (subject: SubjectConfig | null) => void;
  setHomeView: (view: HomeViewType) => void;
  toggleTheme: () => void;
  toggleZenMode: () => void;
  setSettingsOpen: (val: boolean) => void;
}

export const CommandPalette = ({ 
  isOpen, 
  setIsOpen, 
  setActiveSubject, 
  setHomeView,
  toggleTheme,
  toggleZenMode,
  setSettingsOpen
}: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items = [
    { id: 'settings', label: 'Настройки', icon: Settings, action: () => { setSettingsOpen(true); setIsOpen(false); }, isSubject: false },
    { id: 'profile', label: 'Профил', icon: User, action: () => { setSettingsOpen(true); setIsOpen(false); }, isSubject: false },
    { id: 'zen', label: 'Zen Mode Toggle', icon: Volume2, action: () => { toggleZenMode(); setIsOpen(false); }, isSubject: false },
    { id: 'theme', label: 'Смени Тема', icon: Sun, action: () => { toggleTheme(); setIsOpen(false); }, isSubject: false },
    { id: 'subscription', label: 'Абонамент', icon: CreditCard, action: () => { setSettingsOpen(true); setIsOpen(false); }, isSubject: false },
    ...SUBJECTS.map(s => ({
        id: s.id,
        label: s.name,
        icon: s.icon, 
        isSubject: true,
        subject: s,
        action: () => { setActiveSubject(s); setIsOpen(false); }
    }))
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: any) => {
      item.action();
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
              handleSelect(filteredItems[selectedIndex]);
          }
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-indigo-500/20 overflow-hidden flex flex-col max-h-[60vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-white/5">
                <Search size={20} className="text-gray-400 mr-3"/>
                <input 
                    ref={inputRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleListKeyDown}
                    placeholder="Какво търсиш? (Команди, Предмети, Настройки...)"
                    className="flex-1 bg-transparent outline-none text-lg placeholder-gray-400 text-zinc-900 dark:text-white"
                />
                <div className="text-xs font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-500">ESC</div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Няма намерени резултати.</div>
                ) : (
                    <div className="space-y-1">
                        {filteredItems.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={`w-full flex items-center px-3 py-3 rounded-xl transition-colors text-left ${index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'}`}
                            >
                                <div className={`p-2 rounded-lg mr-3 ${index === selectedIndex ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-200' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                    {item.isSubject ? <DynamicIcon name={item.icon as string} className="w-5 h-5"/> : (
                                        item.icon && typeof item.icon !== 'string' ? <item.icon size={20}/> : null
                                    )}
                                </div>
                                <span className="flex-1 font-medium">{item.label}</span>
                                {index === selectedIndex && <ArrowRight size={16} className="text-indigo-500"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="px-4 py-2 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 text-xs text-gray-400 flex justify-between">
                <span>Use arrows to navigate, Enter to select</span>
                <span>Uchebnik AI Command Palette</span>
            </div>
        </div>
        <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)}/>
    </div>
  );
};
