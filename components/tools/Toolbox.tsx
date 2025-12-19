
import React, { useState, useEffect } from 'react';
import { X, Clock, Calculator, StickyNote, RefreshCw, Atom, Music, Play, Pause, RotateCcw, Volume2, VolumeX, Check, ChevronRight } from 'lucide-react';
import { UserSettings } from '../../types';

interface ToolboxProps {
  activeTool: string | null;
  onClose: () => void;
  userSettings: UserSettings;
  setUserSettings: (s: any) => void;
}

export const Toolbox = ({ activeTool, onClose, userSettings, setUserSettings }: ToolboxProps) => {
  if (!activeTool) return null;

  return (
    <div className="fixed right-4 bottom-24 z-[60] w-80 md:w-96 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-right fade-in duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-indigo-500/5">
        <h3 className="font-bold text-lg flex items-center gap-2">
          {activeTool === 'calculator' && <><Calculator size={20} className="text-indigo-500"/> Калкулатор</>}
          {activeTool === 'timer' && <><Clock size={20} className="text-orange-500"/> Pomodoro Timer</>}
          {activeTool === 'notes' && <><StickyNote size={20} className="text-yellow-500"/> Бележки</>}
          {activeTool === 'converter' && <><RefreshCw size={20} className="text-green-500"/> Конвертор</>}
          {activeTool === 'periodic' && <><Atom size={20} className="text-blue-500"/> Менделеева таблица</>}
          {activeTool === 'music' && <><Music size={20} className="text-pink-500"/> Lo-Fi Focus</>}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X size={18}/></button>
      </div>
      
      <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {activeTool === 'calculator' && <ScientificCalculator />}
        {activeTool === 'timer' && <PomodoroTimer />}
        {activeTool === 'notes' && <QuickNotes notes={userSettings.notes} onChange={(n) => setUserSettings({...userSettings, notes: n})} />}
        {activeTool === 'converter' && <UnitConverter />}
        {activeTool === 'periodic' && <PeriodicTableWidget />}
        {activeTool === 'music' && <MusicPlayer />}
      </div>
    </div>
  );
};

const ScientificCalculator = () => {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');

  const calc = (btn: string) => {
    if (btn === 'C') { setDisplay(''); setResult(''); }
    else if (btn === '=') {
      try {
        // eslint-disable-next-line no-eval
        setResult(eval(display.replace('x', '*').replace('÷', '/').replace('^', '**')).toString());
      } catch { setResult('Error'); }
    }
    else if (btn === '√') { setDisplay(`Math.sqrt(${display})`); }
    else if (btn === 'sin') { setDisplay(`Math.sin(${display})`); }
    else if (btn === 'cos') { setDisplay(`Math.cos(${display})`); }
    else if (btn === 'tan') { setDisplay(`Math.tan(${display})`); }
    else setDisplay(display + btn);
  };

  const btns = ['C', '(', ')', '÷', '7', '8', '9', 'x', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '^', '='];

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-black/40 p-4 rounded-xl text-right">
        <div className="text-gray-500 text-sm h-5">{display}</div>
        <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{result || display || '0'}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {btns.map(b => (
          <button key={b} onClick={() => calc(b)} className={`p-3 rounded-lg font-bold text-lg transition-colors ${b === '=' ? 'bg-indigo-600 text-white col-span-2' : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
};

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus'|'break'>('focus');

  useEffect(() => {
    let interval: any = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime(time - 1), 1000);
    } else if (time === 0) {
      setIsActive(false);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(()=>{});
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => { setIsActive(false); setTime(mode === 'focus' ? 25 * 60 : 5 * 60); };
  const setSession = (m: 'focus'|'break') => { setMode(m); setIsActive(false); setTime(m === 'focus' ? 25 * 60 : 5 * 60); };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
        <button onClick={() => setSession('focus')} className={`flex-1 py-1 text-sm font-bold rounded-lg transition-colors ${mode === 'focus' ? 'bg-white dark:bg-zinc-700 shadow text-indigo-500' : 'text-gray-500'}`}>Focus</button>
        <button onClick={() => setSession('break')} className={`flex-1 py-1 text-sm font-bold rounded-lg transition-colors ${mode === 'break' ? 'bg-white dark:bg-zinc-700 shadow text-green-500' : 'text-gray-500'}`}>Break</button>
      </div>
      <div className="text-6xl font-black font-mono tracking-tighter text-zinc-800 dark:text-white">{fmt(time)}</div>
      <div className="flex justify-center gap-4">
        <button onClick={toggle} className="p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg transition-all active:scale-95">
          {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1"/>}
        </button>
        <button onClick={reset} className="p-4 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 rounded-full text-gray-600 dark:text-gray-300 transition-all">
          <RotateCcw size={24}/>
        </button>
      </div>
    </div>
  );
};

const QuickNotes = ({notes, onChange}: {notes: string, onChange: (s: string) => void}) => (
  <textarea 
    value={notes} 
    onChange={e => onChange(e.target.value)} 
    placeholder="Запиши си нещо важно..." 
    className="w-full h-64 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 resize-none outline-none text-zinc-800 dark:text-yellow-100 placeholder-yellow-800/30"
  />
);

const UnitConverter = () => {
  const [val, setVal] = useState(1);
  const [type, setType] = useState('length');
  // Simple implementation for demo
  return (
    <div className="space-y-4">
      <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent">
        <option value="length">Length (m to ft)</option>
        <option value="mass">Mass (kg to lbs)</option>
        <option value="temp">Temp (C to F)</option>
      </select>
      <div className="flex items-center gap-2">
        <input type="number" value={val} onChange={e => setVal(Number(e.target.value))} className="w-full p-2 bg-gray-50 dark:bg-black/20 border rounded-lg" />
        <span className="font-bold">=</span>
        <div className="w-full p-2 bg-gray-100 dark:bg-white/10 rounded-lg font-mono">
          {type === 'length' ? (val * 3.28084).toFixed(2) + ' ft' : type === 'mass' ? (val * 2.20462).toFixed(2) + ' lbs' : ((val * 9/5) + 32).toFixed(1) + ' °F'}
        </div>
      </div>
    </div>
  );
};

const PeriodicTableWidget = () => (
  <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
    {['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar'].map(e => (
      <div key={e} className="aspect-square bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">{e}</div>
    ))}
    <div className="col-span-4 text-xs text-gray-400 mt-2">More elements available in full view</div>
  </div>
);

const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if(!audioRef.current) audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3');
    audioRef.current.loop = true;
    if(playing) audioRef.current.play(); else audioRef.current.pause();
    return () => { audioRef.current?.pause(); }
  }, [playing]);

  return (
    <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white text-center space-y-4">
      <Music size={48} className={`mx-auto ${playing ? 'animate-bounce' : ''}`}/>
      <div>
        <h4 className="font-bold text-lg">Lo-Fi Study Beats</h4>
        <p className="text-white/70 text-sm">Relax & Focus</p>
      </div>
      <button onClick={() => setPlaying(!playing)} className="p-4 bg-white text-purple-600 rounded-full shadow-lg hover:scale-105 transition-transform">
        {playing ? <Pause fill="currentColor"/> : <Play fill="currentColor" className="ml-1"/>}
      </button>
    </div>
  );
};
