import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Image as ImageIcon, Send, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { UserSettings } from '../../types';
import { resizeImage } from '../../utils/image';
import { MODAL_ENTER } from '../../animations/transitions';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  userId?: string;
}

export const ReportModal = ({ isOpen, onClose, userSettings, addToast, userId }: ReportModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array
      // Fix: Cast to File[] to ensure 'file' in filter/map is correctly typed as File instead of 'unknown'
      const allFiles = Array.from(files) as File[];
      
      // Strict filtering: must be an image AND NOT an SVG
      const imageFiles = allFiles.filter(file => 
        file.type.startsWith('image/') && file.type !== 'image/svg+xml'
      );

      // If any files were filtered out (including SVGs), show an error
      if (imageFiles.length !== allFiles.length) {
        addToast("Моля, прикачвайте само стандартни изображения (.jpg, .png, .webp). SVG файлове не се поддържат.", "error");
      }

      // Check if we still have any valid images to process
      if (imageFiles.length === 0) {
        e.target.value = '';
        return;
      }

      if (imageFiles.length + images.length > 3) {
        addToast("Максимум 3 снимки.", "error");
        e.target.value = '';
        return;
      }

      try {
        const processedImages = await Promise.all(
          // Fix: Removed redundant 'as File' cast since imageFiles is now inferred as File[]
          imageFiles.map(file => resizeImage(file, 800, 0.6))
        );
        setImages(prev => [...prev, ...processedImages]);
      } catch (err) {
        console.error("Image processing error", err);
        addToast("Грешка при обработката на снимките.", "error");
      }
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
        addToast("Моля, попълнете заглавие и описание.", "error");
        return;
    }

    if (!userId) {
        addToast("Трябва да сте влезли в профила си, за да докладвате проблем.", "error");
        return;
    }

    setIsSubmitting(true);

    try {
        const { error } = await supabase.from('reports').insert({
            user_id: userId,
            title: title.trim(),
            description: description.trim(),
            images: images, // Storing as JSONB array of base64 strings
            status: 'open'
        });

        if (error) throw error;

        addToast("Докладът е изпратен успешно! Благодарим ви.", "success");
        setTitle('');
        setDescription('');
        setImages([]);
        onClose();

    } catch (e: any) {
        console.error("Report submission error:", e);
        if (e.code === '42P01') {
            addToast("Системна грешка: Таблицата за доклади липсва (SQL required).", "error");
        } else {
            addToast("Грешка при изпращане. Опитайте отново.", "error");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div 
            className={`w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col ${MODAL_ENTER}`} 
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/5 bg-white/5 relative z-10">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <AlertTriangle size={24} className="text-amber-500" fill="currentColor"/> Докладвай проблем
                </h2>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                    <X size={20}/>
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar max-h-[70vh]">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Заглавие</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Напр. Грешка при генериране на тест"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Описание</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Опишете проблема детайлно..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-colors min-h-[120px] resize-none"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1 flex justify-between">
                        <span>Скрийншоти (Опционално)</span>
                        <span>{images.length}/3</span>
                    </label>
                    
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {images.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 shrink-0 group rounded-xl overflow-hidden border border-white/10">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => handleRemoveImage(i)}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} className="text-white"/>
                                </button>
                            </div>
                        ))}
                        
                        {images.length < 3 && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 rounded-xl border border-dashed border-white/20 hover:border-amber-500 hover:bg-amber-500/10 flex flex-col items-center justify-center text-zinc-500 hover:text-amber-500 transition-all shrink-0"
                                disabled={isSubmitting}
                            >
                                <ImageIcon size={20} />
                                <span className="text-[10px] font-bold mt-1">Добави</span>
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/jpeg,image/png,image/webp" 
                            multiple 
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={18}/>}
                    {isSubmitting ? 'Изпращане...' : 'Изпрати доклад'}
                </button>
            </div>
        </div>
    </div>
  );
};
