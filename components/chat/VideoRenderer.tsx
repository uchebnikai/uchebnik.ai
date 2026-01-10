

import React, { useState } from 'react';
import { Play, ExternalLink, Youtube, Video, X } from 'lucide-react';
import { VideoData } from '../../types';

// Use React.FC to properly support reserved props like 'key' when called from maps in MessageList
export const VideoRenderer: React.FC<{ data: VideoData }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
      }
    }
    return null;
  };

  const embedUrl = getEmbedUrl(data.url);
  const isYoutube = data.platform === 'youtube' || data.url.includes('youtube.com') || data.url.includes('youtu.be');

  if (isPlaying && embedUrl) {
    return (
      <div className="mt-4 w-full aspect-video rounded-3xl overflow-hidden border border-indigo-500/30 bg-black shadow-2xl animate-in zoom-in-95 duration-300 relative group">
        <iframe
          src={embedUrl}
          title={data.title || "Video Player"}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button 
          onClick={() => setIsPlaying(false)}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 glass-card rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-indigo-500/30 transition-all group border border-indigo-500/10">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Thumbnail Placeholder / Icon */}
        <div className="relative shrink-0 w-full md:w-32 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-white/10">
            {isYoutube ? (
                <Youtube className="text-red-500 w-10 h-10" />
            ) : (
                <Video className="text-indigo-500 w-10 h-10" />
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                {data.platform || 'Video'}
             </span>
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-white truncate mb-2 pr-4">{data.title || "Video Resource"}</h4>
          
          <div className="flex gap-2">
            {embedUrl && (
                <button 
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Play size={14} fill="currentColor"/> Гледай тук
                </button>
            )}
            <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
            >
                <ExternalLink size={14}/> Отвори в {data.platform === 'youtube' ? 'YouTube' : 'браузър'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};