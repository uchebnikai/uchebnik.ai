
import React, { useState } from 'react';
import { Maximize, ExternalLink, X, Minimize } from 'lucide-react';

export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const isWebCode = lang === 'html' || lang === 'xml';
  const codeContent = String(children);
  
  const handleOpenNewTab = () => {
      const blob = new Blob([codeContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  };

  if (inline) {
    return <code className="bg-gray-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400 break-words whitespace-pre-wrap" {...props}>{children}</code>;
  }

  return (
    <>
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
                <div className="flex items-center gap-2">
                    {view === 'preview' && (
                        <div className="flex items-center gap-1 mr-2 border-r border-gray-300 dark:border-white/10 pr-2">
                            <button onClick={() => setIsFullScreen(true)} className="p-1.5 text-gray-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-white/10 rounded-md transition-colors" title="Full Screen">
                                <Maximize size={14} />
                            </button>
                            <button onClick={handleOpenNewTab} className="p-1.5 text-gray-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-white/10 rounded-md transition-colors" title="Open in New Tab">
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-0.5 rounded-lg">
                        <button onClick={() => setView('code')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'code' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Код</button>
                        <button onClick={() => setView('preview')} className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${view === 'preview' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-gray-500'}`}>Преглед</button>
                    </div>
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
                <iframe srcDoc={codeContent} title="Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-modals" />
            </div>
        )}
        </div>

        {/* Full Screen Modal */}
        {isFullScreen && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <h3 className="text-white font-bold text-lg">Web Preview</h3>
                        <div className="flex gap-2">
                            <button onClick={handleOpenNewTab} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">
                                <ExternalLink size={14}/> Open in Browser
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsFullScreen(false)} className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-500 rounded-full text-zinc-400 transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                <div className="flex-1 bg-white p-4 md:p-8 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full max-w-[1920px] bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
                        <iframe srcDoc={codeContent} title="Full Preview" className="w-full h-full border-none" sandbox="allow-scripts allow-modals" />
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
