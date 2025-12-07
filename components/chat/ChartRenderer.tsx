import React, { useState } from 'react';
import { BarChart2, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar } from 'recharts';
import { ChartData } from '../../types';

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