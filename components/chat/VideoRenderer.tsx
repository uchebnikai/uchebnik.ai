
import React, { useState } from 'react';
import { Play, ExternalLink, Youtube, Video, X, AlertCircle } from 'lucide-react';
import { VideoData } from '../../types';

export const VideoRenderer: React.FC<{ data: VideoData }> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getEmbedUrl = (url: string) => {
    // YouTube detection
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
      }
    }
    // Vimeo detection
    if (url.includes('vimeo.com')) {
      const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
      const match = url.match(regExp);
      if (match && match[3]) {
        return `https://player.vimeo.com/video/${match[3]}?autoplay=1`;
      }
    }
    return null;
  };

  const embedUrl = getEmbedUrl(data.url);
  const isYoutube = data.platform === 'youtube' || data.url.includes('youtube.com') || data.url.includes('youtu.be');
  const isVimeo = data.platform === 'vimeo' || data.url.includes('vimeo.com');
  const isEmbeddable = !!embedUrl;

  if (isPlaying && isEmbeddable && !hasError) {
    return (
      <div className="mt-4 w-full aspect-video rounded-3xl overflow-hidden border border-indigo-500/30 bg-black shadow-2xl animate-in zoom-in-95 duration-300 relative group">
        <iframe
          src={embedUrl!}
          title={data.title || "Video Player"}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-black/60 hover:bg-black text-white rounded-full backdrop-blur-sm"
                title="Open in new tab"
            >
                <ExternalLink size={16} />
            </a>
            <button 
                onClick={() => setIsPlaying(false)}
                className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-sm"
                title="Close player"
            >
                <X size={16} />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 glass-card rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-indigo-500/40 transition-all group border border-indigo-500/10">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Thumbnail Placeholder / Icon */}
        <div className="relative shrink-0 w-full md:w-36 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-white/10 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
            {isYoutube ? (
                <Youtube className="text-red-500 w-12 h-12 drop-shadow-sm" />
            ) : isVimeo ? (
                <Video className="text-sky-500 w-12 h-12 drop-shadow-sm" />
            ) : (
                <Video className="text-indigo-500 w-12 h-12 drop-shadow-sm" />
            )}
            
            {/* Visual Indicator of platform */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-black uppercase rounded backdrop-blur-sm tracking-widest border border-white/10">
                {data.platform || 'Link'}
            </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                 isYoutube ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                 isVimeo ? 'text-sky-500 bg-sky-500/10 border-sky-500/20' : 
                 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
             }`}>
                {data.platform === 'youtube' ? 'YouTube Resource' : data.platform === 'vimeo' ? 'Vimeo' : 'Video Tutorial'}
             </span>
          </div>
          <h4 className="font-bold text-zinc-900 dark:text-white truncate mb-3 pr-4 text-base leading-tight group-hover:text-indigo-500 transition-colors">
              {data.title || "Recommended Video"}
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {isEmbeddable && !hasError ? (
                <button 
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 hover:-translate-y-0.5"
                >
                    <Play size={14} fill="currentColor"/> Гледай тук
                </button>
            ) : hasError ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium border border-red-500/20">
                    <AlertCircle size={14}/> Вграждането е отказано
                </div>
            ) : null}
            
            <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
            >
                <ExternalLink size={14}/> Отвори в {data.platform === 'youtube' ? 'YouTube' : data.platform === 'tiktok' ? 'TikTok' : 'браузър'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
