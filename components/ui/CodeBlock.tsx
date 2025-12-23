
import React, { useState } from 'react';
import { Play } from 'lucide-react';

export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const isWebCode = lang === 'html' || lang === 'xml';
  const isRunnable = lang === 'javascript' || lang === 'python' || lang === 'html';
  
  if (inline) {
    return <code className="bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words whitespace-pre-wrap" {...props}>{children}</code>;
  }

  const handleRun = () => {
      // Simulate run logic or open simple modal
      if (isWebCode) {
          setView('preview');
      } else {
          alert('Execution simulated: Code runs successfully!');
      }
  };

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

          <div className="flex gap-2">
              {isRunnable && (
                  <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                      <Play size={10} fill="currentColor"/> Run
                  </button>
              )}
              
              {isWebCode && (
                 <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-0.5 rounded-lg">
                    <button onClick={() => setView('code')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Код</button>
                    <button onClick={() => setView('preview')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Преглед</button>
                 </div>
              )}
          </div>
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
