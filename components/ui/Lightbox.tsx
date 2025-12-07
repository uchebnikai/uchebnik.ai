import React from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  image: string | null;
  onClose: () => void;
}

export const Lightbox = ({ image, onClose }: LightboxProps) => {
  if (!image) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"><X size={24} /></button>
      <img src={image} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};