import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Projector, Download, Check, ThumbsUp, ThumbsDown, Reply, Volume2, Square, Copy, Share2, Sparkles } from 'lucide-react';
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

  return (
      <div className={`flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth ${userSettings.textSize === 'large' ? 'text-lg' : userSettings.textSize === 'small' ? 'text-sm' : 'text-base'}`}>
         <div className="max-w-4xl mx-auto space-y-12 pb-48 pt-24">
            {currentMessages.map((msg) => (
               <div key={msg.id} id={msg.id} className={`group flex flex-col gap-2 ${SLIDE_UP} ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Message Bubble */}
                  <div className={`${MSG_CONTAINER_BASE} ${msg.role === 'user' ? MSG_BUBBLE_USER : MSG_BUBBLE_MODEL}`}>
                     
                     {msg.replyToId && (() => {
                        const rMsg = currentMessages.find(m => m.id === msg.replyToId);
                        if (rMsg) return (
                           <div className="mb-4 pl-3 border-l-2 border-white/40 text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => document.getElementById(rMsg.id)?.scrollIntoView({behavior:'smooth', block:'center'})}>
                              <div className="font-bold mb-0.5 text-indigo-200">{rMsg.role === 'user' ? 'Ти' : 'uchebnik.ai'}</div>
                              <div className="truncate italic">{rMsg.text ? rMsg.text.substring(0, 100) : (rMsg.images?.length ? '[Изображение]' : '')}</div>
                           </div>
                        )
                     })()}

                     {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div className="flex gap-4 mb-5 overflow-x-auto pb-2 snap-x no-scrollbar">
                            {msg.images.map((img, i) => ( img && typeof img === 'string' ? ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-48 lg:h-64 rounded-2xl object-cover border border-white/20 snap-center shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"/> ) : null ))}
                        </div>
                     )}
                     
                     {/* Dynamic Content Renderers */}
                     {msg.type === 'slides' && msg.slidesData && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center pb-4 border-b border-white/10"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-400"/> Генерирана Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!, activeSubject, userSettings)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"><Download size={14}/> Изтегли PPTX</button></div>
                           <div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-black/30 p-5 rounded-2xl border border-white/10"><h4 className="font-bold mb-3 text-base text-indigo-300">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div>
                        </div>
                     )}

                     {msg.type === 'test_generated' && msg.testData && (
                        <TestRenderer data={msg.testData} />
                     )}

                     {msg.text && <div className="markdown-content w-full break-words overflow-hidden"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>{msg.text}</ReactMarkdown></div>}
                     {msg.chartData && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && <GeometryRenderer data={msg.geometryData} />}
                     
                     <div className={`text-[10px] mt-3 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-50`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        {msg.role === 'user' && <Check size={12} />}
                     </div>
                  </div>

                  {/* Message Actions */}
                  <div className={`flex gap-1 px-2 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     <div className="flex bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-lg mt-1">
                        {msg.role === 'model' && (
                           <>
                             <button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-emerald-400' : 'text-gray-400'}`}><ThumbsUp size={14}/></button>
                             <button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-400' : 'text-gray-400'}`}><ThumbsDown size={14}/></button>
                             <div className="w-px h-4 bg-white/10 mx-1 self-center"/>
                           </>
                        )}
                        <button onClick={() => handleReply(msg)} className="p-2 text-gray-400 hover:text-white transition-colors"><Reply size={14}/></button>
                        <button onClick={() => handleSpeak(msg.text, msg.id)} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${speakingMessageId === msg.id ? 'text-indigo-400 animate-pulse' : 'text-gray-400'}`}>{speakingMessageId === msg.id ? <Square size={14} fill="currentColor"/> : <Volume2 size={14}/></button>
                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}</button>
                        <button onClick={() => handleShare(msg.text)} className="p-2 text-gray-400 hover:text-white transition-colors"><Share2 size={14}/></button>
                     </div>
                  </div>
               </div>
            ))}
            
            {loadingSubject && (
               <div className={`flex gap-4 pl-4 ${FADE_IN}`}>
                  <div className={`w-10 h-10 rounded-full bg-black/40 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] ${PULSE_SLOW}`}><Sparkles size={18} className="text-indigo-400"/></div>
                  <div className="bg-black/30 px-6 py-4 rounded-[2rem] rounded-bl-sm border border-white/10 flex items-center gap-2 backdrop-blur-md">
                     <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY}`}/>
                     <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY} delay-100`}/>
                     <div className={`w-2 h-2 bg-indigo-500 rounded-full ${BOUNCE_DELAY} delay-200`}/>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-6"/>
         </div>
      </div>
  );
};