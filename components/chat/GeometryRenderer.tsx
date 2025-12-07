import React, { useState } from 'react';
import { Ruler, X } from 'lucide-react';
import { GeometryData } from '../../types';

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