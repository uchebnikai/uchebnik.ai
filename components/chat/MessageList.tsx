import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Projector, Download, Check, ThumbsUp, ThumbsDown, Reply, Volume2, Square, Copy, Share2, Sparkles, Brain, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Message, UserSettings, SubjectConfig } from '../../types';
import { handleDownloadPPTX } from '../../utils/exportUtils';
import { CodeBlock } from '../ui/CodeBlock';
import { ChartRenderer } from './ChartRenderer';
import { GeometryRenderer } from './GeometryRenderer';
import { TestRenderer } from './TestRenderer';
import { MSG_BUBBLE_USER, MSG_BUBBLE_MODEL, MSG_CONTAINER_BASE } from '../../styles/chat';
import { SLIDE_UP, PULSE_SLOW, BOUNCE_DELAY, FADE_IN } from '../../animations/transitions';

interface MessageListProps {
  currentMessages: Message[];
  userSettings: UserSettings;
  setZoomedImage: (img: string) => void;
  handleRate: (id: string, rating: 'up' | 'down') => void;
  handleReply: (msg: Message) => void;
  handleSpeak: (text: string, id: string) => void;
  speakingMessageId: string | null;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleShare: (text: string) => void;
  loadingSubject: boolean;
  activeSubject: SubjectConfig | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList = ({
  currentMessages,
  userSettings,
  setZoomedImage,
  handleRate,
  handleReply,
  handleSpeak,
  speakingMessageId,
  handleCopy,
  copiedId,
  handleShare,
  loadingSubject,
  activeSubject,
  messagesEndRef
}: MessageListProps) => {

  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const toggleReasoning = (id: string) => {
     setExpandedReasoning(prev => ({
        ...prev,
        [id]: !prev[id]
     }));
  };

  return (
      <div className={`flex-1 overflow-y-auto px-2 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth ${userSettings.textSize === 'large' ? 'text-lg' : userSettings.textSize === 'small' ? 'text-sm' : 'text-base'}`}>
         <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-40 pt-2 lg:pt-4">
            {currentMessages.map((msg) => (
               <div key={msg.id} id={msg.id} className={`group flex flex-col gap-2 ${SLIDE_UP} duration-700 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`${MSG_CONTAINER_BASE} ${msg.role === 'user' ? MSG_BUBBLE_USER : MSG_BUBBLE_MODEL}`}>
                     
                     {/* Quote Block for Replies */}
                     {msg.replyToId && (() => {
                        const rMsg = currentMessages.find(m => m.id === msg.replyToId);
                        if (rMsg) return (
                           <div className="mb-3 pl-3 border-l-2 border-current/30 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => document.getElementById(rMsg.id)?.scrollIntoView({behavior:'smooth', block:'center'})}>
                              <div className="font-bold mb-0.5">{rMsg.role === 'user' ? 'Ти' : 'uchebnik.ai'}</div>
                              <div className="truncate italic">{rMsg.text ? rMsg.text.substring(0, 100) : (rMsg.images?.length ? '[Изображение]' : '')}</div>
                           </div>
                        )
                     })()}

                     {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x">
                            {msg.images.map((img, i) => ( img && typeof img === 'string' ? ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-40 lg:h-56 rounded-2xl object-cover border border-white/20 snap-center shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"/> ) : null ))}
                        </div>
                     )}
                     
                     {/* Reasoning / Thinking Toggle */}
                     {msg.reasoning && (
                        <div className="mb-4">
                           <button 
                              onClick={() => toggleReasoning(msg.id)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border w-full sm:w-auto
                                 ${expandedReasoning[msg.id] 
                                    ? 'bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/20' 
                                    : 'bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                                 }`}
                           >
                              <Brain size={14} className={expandedReasoning[msg.id] ? 'text-indigo-500 animate-pulse' : 'opacity-70'} />
                              <span>{expandedReasoning[msg.id] ? 'Скрий мислите' : 'Виж как разсъждавам'}</span>
                              {expandedReasoning[msg.id] ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                           </button>
                           
                           {expandedReasoning[msg.id] && (
                              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-gray-50/80 dark:bg-black/20 p-4 rounded-xl border-l-2 border-indigo-500/30 animate-in slide-in-from-top-2 fade-in">
                                 <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold opacity-70 uppercase tracking-widest text-[10px]">
                                     <Lightbulb size={12}/> Chain of Thought
                                 </div>
                                 <div className="markdown-content italic opacity-90">
                                    <ReactMarkdown>{msg.reasoning || ""}</ReactMarkdown>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {msg.type === 'slides' && msg.slidesData && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-4 border-b border-indigo-500/20"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-500"/> Генерирана Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!, activeSubject, userSettings)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-lg shadow-emerald-500/20"><Download size={14}/> Изтегли PPTX</button></div>
                           <div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-white/40 dark:bg-black/40 p-5 rounded-2xl border border-indigo-500/10"><h4 className="font-bold mb-3 text-base text-indigo-600 dark:text-indigo-400">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div>
                        </div>
                     )}

                     {msg.type === 'test_generated' && msg.testData && (
                        <TestRenderer data={msg.testData} />
                     )}

                     {msg.text && <div className="markdown-content w-full break-words overflow-hidden"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>{msg.text}</ReactMarkdown></div>}
                     {msg.chartData && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && <GeometryRenderer data={msg.geometryData} />}
                     
                     <div className={`text-[10px] mt-2 lg:mt-4 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-60`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        {msg.role === 'user' && <Check size={12} />}
                     </div>
                  </div>

                  <div className={`flex gap-1 px-4 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     {/* Action Buttons */}
                     <div className="flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-indigo-500/20 rounded-full p-1.5 shadow-sm mt-1">
                        {msg.role === 'model' && (
                           <>
                             <button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp size={14} className="lg:w-4 lg:h-4"/></button>
                             <button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown size={14} className="lg:w-4 lg:h-4"/></button>
                             <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 self-center"/>
                           </>
                        )}
                        <button onClick={() => handleReply(msg)} className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Отговор"><Reply size={14} className="lg:w-4 lg:h-4"/></button>
                        <button onClick={() => handleSpeak(msg.text, msg.id)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${speakingMessageId === msg.id ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`}>{speakingMessageId === msg.id ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="lg:w-4 lg:h-4"/>}</button>
                        <button onClick={() => handleShare(msg.text)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Share2 size={14} className="lg:w-4 lg:h-4"/></button>
                     </div>
                  </div>
               </div>
            ))}
            
            {loadingSubject && (
               <div className={`flex flex-col gap-2 pl-4 ${FADE_IN} duration-500`}>
                  <div className="flex gap-4">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white dark:bg-zinc-900 border border-indigo-500/20 flex items-center justify-center shadow-sm ${PULSE_SLOW}`}><Brain size={18} className="text-indigo-500"/></div>
                      <div className="bg-white/50 dark:bg-white/5 px-6 py-4 rounded-[24px] lg:rounded-[32px] rounded-bl-sm border border-indigo-500/20 flex items-center gap-2 backdrop-blur-md">
                         <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY}`}/>
                         <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY} delay-100`}/>
                         <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY} delay-200`}/>
                      </div>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest pl-16 animate-pulse">Thinking...</div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-6 lg:h-10"/>
         </div>
      </div>
  );
};