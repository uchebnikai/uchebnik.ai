import React, { useState } from 'react';
import { BarChart2, X, Ruler } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ChartData, GeometryData } from '../types';

export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const isWebCode = lang === 'html' || lang === 'xml';
  
  if (inline) {
    return <code className="bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words whitespace-pre-wrap" {...props}>{children}</code>;
  }

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-indigo-500/20 bg-white/50 dark:bg-black/30 shadow-sm backdrop-blur-sm w-full max-w-full">
       <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50 dark:bg-white/5 border-b border-indigo-500/10">
          <div className="flex items-center gap-2">
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
             </div>
             <span className="ml-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">{lang || 'КОД'}</span>
          </div>

          {isWebCode && (
             <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-0.5 rounded-lg">
                <button onClick={() => setView('code')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Код</button>
                <button onClick={() => setView('preview')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Преглед</button>
             </div>
          )}
       </div>

       {view === 'code' ? (
          <div className="relative group/copy">
            <pre className="p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed custom-scrollbar bg-transparent max-w-full">
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
       ) : (
          <div className="w-full h-[400px] bg-white border-t border-gray-200">
             <iframe srcDoc={String(children)} title="Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-modals" />
          </div>
       )}
    </div>
  );
};

export const ChartRenderer = ({ data }: { data: ChartData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><BarChart2 size={18} /></div>
        <span>Визуализирай данни</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Графика"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'line' ? (
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'var(--tooltip-bg, #fff)' }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const GeometryRenderer = ({ data }: { data: GeometryData }) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} className="mt-2 w-full flex items-center justify-center gap-3 bg-white/50 dark:bg-zinc-900/50 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-5 py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Ruler size={18} /></div>
        <span>Покажи чертеж</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-5 glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.title || "Чертеж"}</h4>
        <button onClick={() => setVisible(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"><X size={16} /></button>
      </div>
      <div className="w-full overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border border-indigo-500/20 p-4 flex justify-center" dangerouslySetInnerHTML={{__html: data.svg}} />
    </div>
  );
};