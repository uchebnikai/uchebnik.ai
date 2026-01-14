
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Projector, Download, Check, ThumbsUp, ThumbsDown, Reply, Volume2, Square, Copy, Share2, Loader2, Globe, ExternalLink, Lock, Sparkles, UserPlus, Brain, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Message, UserSettings, SubjectConfig } from '../../types';
import { handleDownloadPPTX } from '../../utils/exportUtils';
import { CodeBlock } from '../ui/CodeBlock';
import { ChartRenderer } from './ChartRenderer';
import { GeometryRenderer } from './GeometryRenderer';
import { TestRenderer } from './TestRenderer';
import { MSG_BUBBLE_USER, MSG_BUBBLE_MODEL, MSG_CONTAINER_BASE } from '../../styles/chat';
import { SLIDE_UP, FADE_IN } from '../../animations/transitions';

interface MessageListProps {
  currentMessages: Message[];
  userSettings: UserSettings;
  setZoomedImage: (img: string) => void;
  handleRate: (id: string, rating: 'up' | 'down') => void;
  handleReply: (msg: Message) => void;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleShare: (text: string) => void;
  loadingSubject: boolean;
  activeSubject: SubjectConfig | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setShowAuthModal?: (val: boolean) => void;
  isGuest?: boolean;
}

const LOADING_MESSAGES = [
    "Търсене в Google...",
    "Анализирам въпроса...",
    "Проверявам информацията...",
    "Формулирам решение...",
    "Подготвям отговора...",
    "Филтрирам резултатите..."
];

const LoadingIndicator = ({ msgId }: { msgId: string }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Start with a semi-random message based on ID
        let sum = 0;
        for (let i = 0; i < msgId.length; i++) { sum += msgId.charCodeAt(i); }
        setIndex(sum % LOADING_MESSAGES.length);

        // Cycle through messages for a dynamic "thinking" look
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2200);

        return () => clearInterval(interval);
    }, [msgId]);

    return (
        <div className="flex items-center gap-3 text-sm text-zinc-500 italic py-2 animate-pulse">
            <Loader2 className="animate-spin text-indigo-500" size={18}/>
            <span className="transition-all duration-500">{LOADING_MESSAGES[index]}</span>
        </div>
    );
};

const ReasoningBlock = ({ reasoning }: { reasoning: string }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
        <div className="mb-4 overflow-hidden border border-zinc-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Brain size={12} className="text-indigo-500" />
                    <span>Процес на мислене</span>
                </div>
                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 text-xs italic text-zinc-500 dark:text-zinc-400 font-medium whitespace-pre-wrap border-t border-zinc-100 dark:border-white/5 pt-3 leading-relaxed">
                    {reasoning}
                </div>
            )}
        </div>
    );
};

export const MessageList = ({
  currentMessages,
  userSettings,
  setZoomedImage,
  handleRate,
  handleReply,
  handleCopy,
  copiedId,
  handleShare,
  loadingSubject,
  activeSubject,
  messagesEndRef,
  setShowAuthModal,
  isGuest = false
}: MessageListProps) => {

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const lastMsgId = currentMessages[currentMessages.length - 1]?.id;
      if (lastMsgId !== lastMessageIdRef.current || (container.scrollHeight - container.scrollTop - container.clientHeight < 150)) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      lastMessageIdRef.current = lastMsgId || null;
  }, [currentMessages, messagesEndRef]);

  return (
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth">
         <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-40 pt-2 lg:pt-4">
            {currentMessages.map((msg, index) => {
               const isStreaming = msg.isStreaming;
               const hasText = msg.text && msg.text.trim().length > 0;
               const isBlurred = msg.isDemo && isGuest;

               return (
               <div key={msg.id} id={msg.id} className={`group flex flex-col gap-2 ${SLIDE_UP} duration-700 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`${MSG_CONTAINER_BASE} ${msg.role === 'user' ? MSG_BUBBLE_USER : MSG_BUBBLE_MODEL} relative min-h-[60px]`}>
                     
                     {msg.replyToId && (() => {
                        const rMsg = currentMessages.find(m => m.id === msg.replyToId);
                        if (rMsg) return (
                           <div className="mb-3 pl-3 border-l-2 border-current/30 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => document.getElementById(rMsg.id)?.scrollIntoView({behavior:'smooth', block:'center'})}>
                              <div className="font-bold mb-0.5">{rMsg.role === 'user' ? 'Ти' : 'uchebnik.ai'}</div>
                              <div className="truncate italic">{rMsg.text ? rMsg.text.substring(0, 100) : (rMsg.images?.length ? '[Изображение]' : '')}</div>
                           </div>
                        )
                     })()}

                     {/* Reasoning block rendered before images and content for AI responses */}
                     {msg.role === 'model' && msg.reasoning && !isBlurred && (
                         <ReasoningBlock reasoning={msg.reasoning} />
                     )}

                     {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x">
                            {msg.images.map((img, i) => img && ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-40 lg:h-56 rounded-2xl object-cover border border-white/20 snap-center shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"/> ))}
                        </div>
                     )}
                     
                     {msg.type === 'slides' && msg.slidesData && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-4 border-b border-indigo-500/20"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-500"/> Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!, activeSubject, userSettings)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-lg shadow-emerald-500/20"><Download size={14}/> PPTX</button></div>
                           <div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-white/40 dark:bg-black/40 p-5 rounded-2xl border border-indigo-500/10"><h4 className="font-bold mb-3 text-base text-indigo-600 dark:text-indigo-400">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div>
                        </div>
                     )}

                     {msg.type === 'test_generated' && msg.testData && <TestRenderer data={msg.testData} />}

                     {hasText && (
                         <div className={`markdown-content w-full relative transition-all duration-700 ${isBlurred ? 'max-h-[160px] overflow-hidden' : ''}`}>
                             <div className={`${isBlurred ? 'select-none pointer-events-none opacity-50 grayscale-[0.5]' : ''}`}>
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>
                                    {msg.text}
                                </ReactMarkdown>
                                {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-indigo-500 opacity-80 animate-pulse align-middle rounded-sm"/>}
                             </div>
                             
                             {isBlurred && (
                                 <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#09090b] dark:via-[#09090b]/80 dark:to-transparent z-10 flex flex-col items-center justify-end pb-4">
                                     <div className="w-full h-full absolute inset-0 backdrop-blur-[4px] [mask-image:linear-gradient(to_top,black_40%,transparent_100%)] pointer-events-none" />
                                 </div>
                             )}
                         </div>
                     )}

                     {msg.type === 'video' && msg.videoUrl && (
                        <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-black mt-2">
                           <video 
                              src={msg.videoUrl} 
                              autoPlay 
                              playsInline 
                              controls 
                              className="w-full h-auto"
                           />
                        </div>
                     )}

                     {isStreaming && !hasText && !msg.reasoning && (
                        <LoadingIndicator msgId={msg.id} />
                     )}

                     {isBlurred && (
                         <div className={`mt-4 p-8 bg-white/40 dark:bg-black/60 border border-indigo-500/30 rounded-[32px] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-20 flex flex-col items-center text-center gap-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ring-1 ring-white/10`}>
                             <div className="flex -space-x-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-zinc-900 shadow-xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                                    <Sparkles size={24} fill="currentColor" />
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white ring-4 ring-white dark:ring-zinc-900 shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform">
                                    <Lock size={24} />
                                </div>
                             </div>
                             
                             <div className="space-y-2">
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
                                    Отключи пълното решение
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                                    Влез в профила си, за да видиш детайлното обяснение, да ползваш гласовия режим и да запазиш историята си.
                                </p>
                             </div>

                             <div className="flex flex-col gap-4 w-full">
                                 <button 
                                    onClick={() => setShowAuthModal?.(true)}
                                    className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-base shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                                 >
                                    <UserPlus size={20} />
                                    Влез Безплатно
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                 </button>
                                 <div className="flex items-center justify-center gap-2">
                                     <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                                     <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">100% Безплатно</p>
                                     <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-800" />
                                 </div>
                             </div>
                         </div>
                     )}
                     
                     {msg.chartData && !isBlurred && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && !isBlurred && <GeometryRenderer data={msg.geometryData} />}
                     
                     {msg.sources && msg.sources.length > 0 && !isBlurred && (
                         <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
                             <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                 <Globe size={12} /> Използвани източници
                             </div>
                             <div className="flex flex-wrap gap-2">
                                 {msg.sources.map((source, i) => (
                                     <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors group/link max-w-[200px] truncate">
                                         <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                                         <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-50 transition-opacity ml-auto shrink-0"/>
                                     </a>
                                 ))}
                             </div>
                         </div>
                     )}

                     <div className={`text-[10px] mt-2 lg:mt-4 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-40`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        {msg.role === 'user' && <Check size={12} />}
                     </div>
                  </div>

                  {!isBlurred && (
                    <div className={`flex gap-1 px-4 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                        <div className="flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-indigo-500/10 rounded-full p-1 shadow-sm mt-1">
                            {msg.role === 'model' && (
                            <>
                                <button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp size={14}/></button>
                                <button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown size={14}/></button>
                            </>
                            )}
                            <button onClick={() => handleReply(msg)} className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"><Reply size={14}/></button>
                            <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}</button>
                        </div>
                    </div>
                  )}
               </div>
               );
            })}
            <div ref={messagesEndRef} className="h-6 lg:h-10"/>
         </div>
      </div>
  );
};
