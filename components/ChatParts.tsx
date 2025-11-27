import React, { useRef, useEffect } from 'react';
import { Menu, Phone, Plus, History, Image as ImageIcon, Mic, MicOff, ArrowUpRight, X, Check, Volume2, Square, Copy, Share2, ThumbsUp, ThumbsDown, Projector, Download, Sparkles, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import pptxgen from "pptxgenjs";
import { useAppContext } from '../context/AppContext';
import { AppMode, SubjectId, Message } from '../types';
import { SUBJECTS } from '../constants';
import { DynamicIcon, Button } from './ui/UI';
import { CodeBlock, ChartRenderer, GeometryRenderer } from './Markdown';

export const ChatHeader = () => {
  const { activeSubject, setSidebarOpen, activeMode, setActiveMode, createNewSession, startVoiceCall, setHistoryDrawerOpen } = useAppContext();
  return (
      <header className={`sticky top-0 lg:top-4 mx-0 lg:mx-8 z-30 h-16 lg:h-18 bg-white/80 dark:bg-black/80 lg:bg-white/70 lg:dark:bg-black/60 backdrop-blur-xl border-b lg:border border-white/20 dark:border-white/10 lg:shadow-sm lg:rounded-3xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 pt-safe`}>
         <div className="flex items-center gap-3 lg:gap-5 overflow-hidden flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 shrink-0"><Menu size={24}/></button>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${activeSubject?.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}><DynamicIcon name={activeSubject?.icon || 'Book'} className="w-5 h-5 lg:w-6 lg:h-6"/></div>
            <div className="overflow-hidden min-w-0 flex-1">
               <h2 className="font-bold text-zinc-900 dark:text-white leading-none text-base lg:text-lg tracking-tight truncate pr-2">{activeSubject?.name}</h2>
               <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar max-w-full">
                  {activeSubject?.modes.map((m: AppMode) => ( <button key={m} onClick={() => setActiveMode(m)} className={`text-[10px] lg:text-[11px] font-bold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full transition-all whitespace-nowrap ${activeMode === m ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>{m === AppMode.SOLVE ? 'Решаване' : m === AppMode.LEARN ? 'Учене' : m === AppMode.DRAW ? 'Рисуване' : m === AppMode.PRESENTATION ? 'Презентация' : 'Чат'}</button>))}
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 ml-2">
             <Button variant="secondary" onClick={startVoiceCall} className="w-10 h-10 lg:w-12 lg:h-12 p-0 rounded-full border-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30" icon={Phone} />
             <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-white/10 mx-1" />
             <Button variant="primary" onClick={() => activeSubject && createNewSession(activeSubject.id)} className="h-9 lg:h-10 px-3 lg:px-4 text-xs lg:text-sm rounded-xl shadow-none"><Plus size={16} className="lg:w-[18px] lg:h-[18px]"/><span className="hidden sm:inline">Нов</span></Button>
             <Button variant="ghost" onClick={() => setHistoryDrawerOpen(true)} className="w-9 h-9 lg:w-10 lg:h-10 p-0 rounded-full" icon={History} />
         </div>
      </header>
  );
};

export const InputArea = () => {
  const { fileInputRef, handleImageUpload, isListening, toggleListening, activeSubject, loadingSubjects, inputValue, setInputValue, handleSend, selectedImages, setSelectedImages, userSettings } = useAppContext();
  
  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };

  return (
      <div className="absolute bottom-0 left-0 right-0 px-2 lg:px-4 pointer-events-none z-40 flex justify-center pb-safe">
         <div className="w-full max-w-3xl pointer-events-auto mb-4 lg:mb-6">
            <div className={`relative ${userSettings.customBackground ? 'bg-white/50 dark:bg-black/50 border-white/20' : 'bg-white/80 dark:bg-zinc-900/80 border-white/10'} backdrop-blur-xl border shadow-2xl rounded-[28px] transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white dark:focus-within:bg-black p-2 flex items-end gap-2 ${activeSubject && loadingSubjects[activeSubject.id] ? 'opacity-70 pointer-events-none' : ''}`}>
               <button onClick={() => fileInputRef.current?.click()} disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors"><ImageIcon size={20} strokeWidth={2}/></button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
               <button onClick={toggleListening} disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>{isListening ? <MicOff size={20}/> : <Mic size={20} strokeWidth={2}/>}</button>
               <div className="flex-1 py-2"><textarea value={inputValue} onChange={e => { setInputValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }} onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !(activeSubject && loadingSubjects[activeSubject.id])){e.preventDefault(); handleSend();}}} placeholder="Напиши съобщение..." disabled={activeSubject ? loadingSubjects[activeSubject.id] : false} className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-900 dark:text-zinc-100 placeholder-gray-400 resize-none max-h-32 min-h-[24px] leading-6" rows={1} style={{ height: '24px' }}/></div>
               <button onClick={() => handleSend()} disabled={(!inputValue.trim() && !selectedImages.length) || (activeSubject && loadingSubjects[activeSubject.id])} className="flex-none w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"><ArrowUpRight size={22} strokeWidth={2.5} /></button>
               {selectedImages.length > 0 && (<div className="absolute bottom-full left-0 mb-2 ml-2 flex gap-2">{selectedImages.map((img, i) => (<div key={i} className="relative group shrink-0 animate-in zoom-in-95"><img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg"/><button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button></div>))}</div>)}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium opacity-60">AI може да допуска грешки.</p>
         </div>
      </div>
  );
};

export const MessageList = () => {
  const { sessions, activeSessionId, activeSubject, loadingSubjects, handleRate, handleSpeak, speakingMessageId, handleCopy, copiedId, userSettings, setZoomedImage } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sessions, activeSessionId]);

  const handleDownloadPPTX = (slides: any[]) => {
      const p = new pptxgen();
      p.defineSlideMaster({ title: 'MASTER', background: { color: 'FFFFFF' }, objects: [ {rect:{x:0,y:0,w:'100%',h:0.15,fill:{color:'4F46E5'}}}, {text: {text: "uchebnik.ai", options: {x: 0.5, y: '90%', fontSize: 10, color: 'D1D5DB'}}} ], slideNumber: { x: '95%', y: '90%', fontSize: 10, color: '6B7280' } });
      const cover = p.addSlide({masterName:'MASTER'});
      cover.addText(activeSubject?.name || "Презентация", {x:1, y:2, w:'80%', fontSize:44, bold:true, color:'111827', align:'center'});
      if(userSettings.userName) cover.addText(`Автор: ${userSettings.userName}`, {x:1, y:3.5, w:'80%', fontSize:18, color:'4B5563', align:'center'});
      slides.forEach(s => { const slide = p.addSlide({masterName:'MASTER'}); slide.addText(s.title, {x:0.5, y:0.8, w:'90%', fontSize:28, bold:true, color:'1F2937', fontFace:'Arial'}); slide.addText(s.content.map((t:any)=>({text:t, options:{bullet:true, breakLine:true}})), {x:0.5, y:1.8, w:'90%', h:'60%', fontSize:18, color:'374151', fontFace:'Arial', lineSpacing:32}); if(s.notes) slide.addNotes(s.notes); });
      p.writeFile({fileName: 'Presentation.pptx'});
  };
  
  const handleShare = async (text: string) => { if (navigator.share) { try { await navigator.share({ text }); } catch (err) {} } else { handleCopy(text, 'share-fallback'); alert('Текстът е копиран!'); } };

  return (
      <div className={`flex-1 overflow-y-auto px-2 lg:px-8 py-4 lg:py-8 custom-scrollbar scroll-smooth`}>
         <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12 pb-40 pt-2 lg:pt-4">
            {currentMessages.map((msg) => (
               <div key={msg.id} className={`flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-700 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`relative px-5 py-4 lg:px-8 lg:py-6 max-w-[90%] md:max-w-[85%] lg:max-w-[75%] backdrop-blur-md shadow-sm break-words overflow-hidden min-w-0 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-accent-600 text-white rounded-[24px] lg:rounded-[32px] rounded-br-none shadow-xl shadow-indigo-500/20' : 'glass-panel text-zinc-800 dark:text-zinc-200 rounded-[24px] lg:rounded-[32px] rounded-bl-none border-indigo-500/20'}`}>
                     {Array.isArray(msg.images) && msg.images.length > 0 && (<div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x">{msg.images.map((img, i) => ( img && typeof img === 'string' ? ( <img key={i} src={img} onClick={() => setZoomedImage(img)} className="h-40 lg:h-56 rounded-2xl object-cover border border-white/20 snap-center shadow-lg cursor-pointer hover:scale-[1.02] transition-transform"/> ) : null ))}</div>)}
                     {msg.type === 'slides' && msg.slidesData && (<div className="space-y-4"><div className="flex justify-between items-center pb-4 border-b border-indigo-500/20"><span className="font-bold flex gap-2 items-center text-sm"><Projector size={18} className="text-indigo-500"/> Генерирана Презентация</span><button onClick={() => handleDownloadPPTX(msg.slidesData!)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex gap-2 transition-colors shadow-lg shadow-emerald-500/20"><Download size={14}/> Изтегли PPTX</button></div><div className="grid gap-4">{msg.slidesData.map((s, i) => (<div key={i} className="bg-white/40 dark:bg-black/40 p-5 rounded-2xl border border-indigo-500/10"><h4 className="font-bold mb-3 text-base text-indigo-600 dark:text-indigo-400">{i+1}. {s.title}</h4><ul className="space-y-2">{s.content.map((p, j) => <li key={j} className="text-sm opacity-80 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"/>{p}</li>)}</ul></div>))}</div></div>)}
                     {msg.text && <div className="markdown-content w-full break-words overflow-hidden"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{code: CodeBlock}}>{msg.text}</ReactMarkdown></div>}
                     {msg.chartData && <ChartRenderer data={msg.chartData} />}
                     {msg.geometryData && <GeometryRenderer data={msg.geometryData} />}
                     <div className={`text-[10px] mt-2 lg:mt-4 font-bold tracking-wide flex items-center justify-end gap-1.5 opacity-60`}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}{msg.role === 'user' && <Check size={12} />}</div>
                  </div>
                  <div className={`flex gap-1 px-4 transition-all duration-300 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                     {msg.role === 'model' && (<div className="flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-indigo-500/20 rounded-full p-1.5 shadow-sm mt-1"><button onClick={() => handleRate(msg.id, 'up')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'up' ? 'text-green-500' : 'text-gray-400'}`}><ThumbsUp size={14} className="lg:w-4 lg:h-4"/></button><button onClick={() => handleRate(msg.id, 'down')} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.rating === 'down' ? 'text-red-500' : 'text-gray-400'}`}><ThumbsDown size={14} className="lg:w-4 lg:h-4"/></button><div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 self-center"/><button onClick={() => handleSpeak(msg.text, msg.id)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${speakingMessageId === msg.id ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`}>{speakingMessageId === msg.id ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} className="lg:w-4 lg:h-4"/>}</button><button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{copiedId === msg.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="lg:w-4 lg:h-4"/>}</button><button onClick={() => handleShare(msg.text)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Share2 size={14} className="lg:w-4 lg:h-4"/></button></div>)}
                  </div>
               </div>
            ))}
            {activeSubject && loadingSubjects[activeSubject.id] && (<div className="flex gap-4 pl-4 animate-in fade-in duration-500"><div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white dark:bg-zinc-900 border border-indigo-500/20 flex items-center justify-center shadow-sm"><Sparkles size={18} className="text-indigo-500 animate-pulse-slow"/></div><div className="bg-white/50 dark:bg-white/5 px-6 py-4 rounded-[24px] lg:rounded-[32px] rounded-bl-sm border border-indigo-500/20 flex items-center gap-2 backdrop-blur-md"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"/><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-100"/><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200"/></div></div>)}
            <div ref={messagesEndRef} className="h-6 lg:h-10"/>
         </div>
      </div>
  );
};