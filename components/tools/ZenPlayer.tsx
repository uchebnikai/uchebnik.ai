
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, CloudRain, Wind, Coffee, Music } from 'lucide-react';

interface ZenPlayerProps {
  active: boolean;
  onClose: () => void;
  initialSound?: 'rain' | 'lofi' | 'forest' | 'white_noise' | 'none';
}

const SOUNDS = [
    { id: 'lofi', name: 'Lofi Beats', icon: Music, url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'rain', name: 'Soft Rain', icon: CloudRain, url: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_3c34707204.mp3' },
    { id: 'forest', name: 'Forest', icon: Wind, url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_03d6e507f3.mp3' },
    { id: 'white_noise', name: 'Cafe Noise', icon: Coffee, url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
];

export const ZenPlayer = ({ active, onClose, initialSound = 'lofi' }: ZenPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSoundIndex, setCurrentSoundIndex] = useState(SOUNDS.findIndex(s => s.id === initialSound) !== -1 ? SOUNDS.findIndex(s => s.id === initialSound) : 0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState(0.5);

    useEffect(() => {
        if (!active && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [active]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(!isPlaying);
    };

    const nextSound = () => {
        const next = (currentSoundIndex + 1) % SOUNDS.length;
        setCurrentSoundIndex(next);
        setIsPlaying(true); // Auto play next
    };

    // Reload audio source when index changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = SOUNDS[currentSoundIndex].url;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentSoundIndex]);

    if (!active) return null;

    const CurrentIcon = SOUNDS[currentSoundIndex].icon;

    return (
        <div className="fixed bottom-6 right-6 z-[60] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-2xl p-4 w-64 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <CurrentIcon size={16} />
                    </div>
                    <span className="font-bold text-sm truncate">{SOUNDS[currentSoundIndex].name}</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><div className="w-2 h-2 rounded-full bg-red-400 hover:bg-red-500 transition-colors"></div></button>
            </div>
            
            <audio ref={audioRef} loop crossOrigin="anonymous" />

            <div className="flex justify-between items-center gap-4">
                <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95">
                    {isPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-0.5"/>}
                </button>
                
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Volume2 size={14} className="text-gray-400"/>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>

                <button onClick={nextSound} className="text-gray-500 hover:text-indigo-500 transition-colors">
                    <SkipForward size={20}/>
                </button>
            </div>
        </div>
    );
};
