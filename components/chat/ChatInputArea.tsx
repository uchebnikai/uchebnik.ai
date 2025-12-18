
import React, { useRef, useEffect, useState } from 'react';
import { Reply, X, ImageIcon, Mic, MicOff, ArrowUpRight, Calculator, Camera, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, UserSettings } from '../../types';
import { INPUT_AREA_BASE, INPUT_AREA_CUSTOM_BG, INPUT_AREA_DEFAULT_BG } from '../../styles/chat';
import { SLIDE_UP, FADE_IN, ZOOM_IN } from '../../animations/transitions';
import { resizeImage } from '../../utils/image';
import { CameraModal } from '../ui/CameraModal';

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
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  selectedImages: string[];
  handleRemoveImage: (index: number) => void;
  onCameraCapture?: (base64: string) => void;
  onStopGeneration: () => void;
}

const MATH_SYMBOLS = [
  { label: '√', val: '\\sqrt{}' },
  { label: 'π', val: '\\pi' },
  { label: '∫', val: '\\int' },
  { label: 'x²', val: '^2' },
  { label: 'xⁿ', val: '^' },
  { label: '½', val: '\\frac{}{}' },
  { label: 'Σ', val: '\\sum' },
  { label: '≤', val: '\\le' },
  { label: '≥', val: '\\ge' },
  { label: '≠', val: '\\neq' },
  { label: '∞', val: '\\infty' },
  { label: 'θ', val: '\\theta' },
  { label: 'Δ', val: '\\Delta' },
  { label: 'α', val: '\\alpha' },
  { label: 'β', val: '\\beta' },
];

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
  handleRemoveImage,
  onCameraCapture,
  onStopGeneration
}: ChatInputAreaProps) => {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMath, setShowMath] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [inputValue]);

  const insertMath = (latex: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = inputValue.substring(0, start) + latex + inputValue.substring(end);
      setInputValue(newValue);
      // Focus back and move cursor inside brackets if present
      setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.focus();
            const offset = latex.includes('{}') ? latex.indexOf('{}') + 1 : latex.length;
            textareaRef.current.setSelectionRange(start + offset, start + offset);
        }
      }, 0);
    }
  };

  const hasMath = /[\\^_{}]/.test(inputValue) || showMath;

  return (
      <>
        {showCamera && onCameraCapture && (
            <CameraModal 
                onClose={() => setShowCamera(false)}
                onCapture={(img) => {
                    onCameraCapture(img);
                    setShowCamera(false);
                }}
            />
        )}

        <div className="absolute bottom-0 left-0 right-0 px-2 lg:px-4 pointer-events-none z-40 flex justify-center pb-safe">
            <div className="w-full max-w-3xl pointer-events-auto mb-2 lg:mb-4">
                
                {/* Live Math Preview */}
                {hasMath && inputValue.trim() && (
                <div className={`mb-2 mx-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-indigo-500/20 p-3 rounded-2xl shadow-lg ${FADE_IN}`}>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Преглед</div>
                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${inputValue}$`}</ReactMarkdown>
                    </div>
                </div>
                )}

                {/* Math Keypad */}
                {showMath && (
                    <div className={`mb-2 mx-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-indigo-500/20 p-3 rounded-2xl shadow-lg grid grid-cols-5 gap-2 ${SLIDE_UP}`}>
                        {MATH_SYMBOLS.map((sym, i) => (
                            <button key={i} onClick={() => insertMath(sym.val)} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-zinc-700 dark:text-zinc-200 text-sm font-bold transition-colors">
                                {sym.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Reply Banner */}
                {replyingTo && (
                <div className={`mb-2 mx-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-indigo-500/20 p-2 rounded-2xl flex items-center justify-between shadow-lg ${SLIDE_UP} ${FADE_IN}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Reply size={14}/>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Отговор на {replyingTo.role === 'user' ? 'теб' : 'uchebnik.ai'}</span>
                            <span className="text-xs font-medium truncate text-zinc-800 dark:text-zinc-200">{replyingTo.text || "Изображение"}</span>
                        </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                        <X size={14}/>
                    </button>
                </div>
                )}

                <div className={`${INPUT_AREA_BASE} ${userSettings.customBackground ? INPUT_AREA_CUSTOM_BG : INPUT_AREA_DEFAULT_BG}`}>
                
                {/* Attach Button */}
                <button onClick={() => fileInputRef.current?.click()} disabled={loadingSubject} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <ImageIcon size={20} strokeWidth={2}/>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                
                {/* Camera Button */}
                {onCameraCapture && (
                    <button onClick={() => setShowCamera(true)} disabled={loadingSubject} className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Camera size={20} strokeWidth={2}/>
                    </button>
                )}

                {/* Math Toggle */}
                <button onClick={() => setShowMath(!showMath)} disabled={loadingSubject} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${showMath ? 'text-indigo-600 bg-indigo-50 dark:bg-white/10' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>
                    <Calculator size={20} strokeWidth={2}/>
                </button>

                {/* Voice Button */}
                <button onClick={toggleListening} disabled={loadingSubject} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10'}`}>
                    {isListening ? <MicOff size={20}/> : <Mic size={20} strokeWidth={2}/>}
                </button>

                {/* Textarea */}
                <div className="flex-1 py-2">
                    <textarea 
                        ref={textareaRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !loadingSubject){e.preventDefault(); handleSend();}}} 
                        placeholder={replyingTo ? "Напиши отговор..." : loadingSubject ? "AI генерира отговор..." : "Напиши съобщение..."}
                        disabled={loadingSubject}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-zinc-900 dark:text-zinc-100 placeholder-gray-400 resize-none max-h-24 min-h-[24px] leading-6 disabled:opacity-60 disabled:cursor-not-allowed"
                        rows={1}
                    />
                </div>

                {/* Send / Stop Button */}
                {loadingSubject ? (
                    <button onClick={onStopGeneration} className="flex-none w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95 animate-in zoom-in duration-300">
                        <Square size={16} fill="currentColor" strokeWidth={2.5} />
                    </button>
                ) : (
                    <button onClick={handleSend} disabled={(!inputValue.trim() && !selectedImages.length)} className="flex-none w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                        <ArrowUpRight size={20} strokeWidth={2.5} />
                    </button>
                )}

                {/* Image Preview Overlay */}
                {selectedImages.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 ml-2 flex gap-2">
                        {selectedImages.map((img, i) => ( 
                            <div key={i} className={`relative group shrink-0 ${ZOOM_IN}`}>
                                <img src={img} className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-zinc-700 shadow-lg"/>
                                <button onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
      </>
  );
};
