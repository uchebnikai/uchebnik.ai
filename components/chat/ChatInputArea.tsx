import React from 'react';
import { Reply, X, ImageIcon, Mic, MicOff, ArrowUpRight } from 'lucide-react';
import { Message, UserSettings } from '../../types';
import { INPUT_AREA_BASE, INPUT_AREA_CUSTOM_BG, INPUT_AREA_DEFAULT_BG } from '../../styles/chat';
import { SLIDE_UP, FADE_IN, ZOOM_IN } from '../../animations/transitions';
import { getDynamicHeightStyle } from '../../styles/utils';

interface ChatInputAreaProps {
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  userSettings: UserSettings;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadingSubject: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleListening: () => void;
  isListening: boolean;
  inputValue: string;
  setInputValue: (val: string) => void;
  handleSend: () => void;
  selectedImages: string[];
  handleRemoveImage: (index: number) => void;
}

export const ChatInputArea = ({
  replyingTo,
  setReplyingTo,
  userSettings,
  fileInputRef,
  loadingSubject,
  handleImageUpload,
  toggleListening,
  isListening,
  inputValue,
  setInputValue,
  handleSend,
  selectedImages,
  handleRemoveImage
}: ChatInputAreaProps) => {

  return (
      <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-40 flex justify-center">
         <div className="w-full max-w-3xl pointer-events-auto">
            
            {/* Reply Banner */}
            {replyingTo && (
               <div className={`mb-3 mx-6 bg-black/60 backdrop-blur-xl border border-indigo-500/30 p-3 rounded-2xl flex items-center justify-between shadow-2xl ${SLIDE_UP}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-300 shrink-0">
                        <Reply size={14}/>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Отговор на {replyingTo.role === 'user' ? 'теб' : 'uchebnik.ai'}</span>
                        <span className="text-sm font-medium truncate text-white">{replyingTo.text || "Изображение"}</span>
                     </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                     <X size={14}/>
                  </button>
               </div>
            )}

            <div className={`${INPUT_AREA_BASE} ${userSettings.customBackground ? INPUT_AREA_CUSTOM_BG : INPUT_AREA_DEFAULT_BG} ${loadingSubject ? 'opacity-70 pointer-events-none' : ''}`}>
               
               {/* Attach Button */}
               <button onClick={() => fileInputRef.current?.click()} disabled={loadingSubject} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <ImageIcon size={20}/>
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />

               {/* Voice Button */}
               <button onClick={toggleListening} disabled={loadingSubject} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${isListening ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
               </button>

               {/* Textarea */}
               <div className="flex-1 py-2">
                   <textarea 
                      value={inputValue}
                      onChange={e => {
                          setInputValue(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                      }}
                      onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !loadingSubject){e.preventDefault(); handleSend();}}} 
                      placeholder={replyingTo ? "Напиши отговор..." : "Напиши съобщение..."}
                      disabled={loadingSubject}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-white placeholder-gray-500 resize-none max-h-32 min-h-[24px] leading-6"
                      rows={1}
                      style={getDynamicHeightStyle(24)}
                   />
               </div>

               {/* Send Button */}
               <button onClick={handleSend} disabled={(!inputValue.trim() && !selectedImages.length) || loadingSubject} className="flex-none w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                  <ArrowUpRight size={20} strokeWidth={3} />
               </button>

               {/* Image Preview Overlay */}
               {selectedImages.length > 0 && (
                   <div className="absolute bottom-full left-0 mb-3 ml-2 flex gap-3">
                      {selectedImages.map((img, i) => ( 
                          <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                              <img src={img} className="h-16 w-16 rounded-xl object-cover border border-white/20 shadow-xl"/>
                              <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                          </div>
                      ))}
                   </div>
               )}
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-3 font-medium opacity-60 tracking-wide">AI може да допуска грешки.</p>
         </div>
      </div>
  );
};