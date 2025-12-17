import React from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2, Loader2 } from 'lucide-react';
import { SubjectConfig } from '../../types';

interface VoiceCallOverlayProps {
  isVoiceCallActive: boolean;
  voiceCallStatus: 'idle' | 'listening' | 'processing' | 'speaking';
  voiceMuted: boolean;
  setVoiceMuted: (val: boolean) => void;
  endVoiceCall: () => void;
  activeSubject: SubjectConfig | null;
}

export const VoiceCallOverlay = ({
  isVoiceCallActive,
  voiceCallStatus,
  voiceMuted,
  setVoiceMuted,
  endVoiceCall,
  activeSubject
}: VoiceCallOverlayProps) => {
    
    if (!isVoiceCallActive) return null;
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden">
        
        {/* Controls Header */}
        <div className="absolute top-6 right-6 z-20">
           <button onClick={endVoiceCall} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"><X size={28}/></button>
        </div>
        
        {/* Main Visualizer */}
        <div className="relative mb-12 z-10">
           <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 backdrop-blur-sm border border-white/10 ${voiceCallStatus === 'listening' ? 'bg-indigo-600/80 shadow-[0_0_100px_rgba(79,70,229,0.6)] scale-110' : voiceCallStatus === 'speaking' ? 'bg-emerald-500/80 shadow-[0_0_100px_rgba(16,185,129,0.6)] scale-105' : 'bg-zinc-800/80'}`}>
               {voiceCallStatus === 'listening' ? <Mic size={64} className="text-white animate-pulse"/> : 
                voiceCallStatus === 'speaking' ? <Volume2 size={64} className="text-white animate-bounce"/> :
                <Loader2 size={64} className="text-white animate-spin"/>}
           </div>
           {voiceCallStatus === 'listening' && (
              <>
                 <div className="absolute inset-0 border border-white/30 rounded-full animate-ping"/>
                 <div className="absolute inset-0 border border-indigo-500/50 rounded-full animate-ping delay-300"/>
              </>
           )}
        </div>

        {/* Text Status */}
        <div className="z-10 text-center mb-16 space-y-2">
           <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
              {voiceCallStatus === 'listening' ? "Слушам те..." : 
               voiceCallStatus === 'processing' ? "Мисля..." : 
               voiceCallStatus === 'speaking' ? "Говоря..." : 
               voiceMuted ? "Заглушен" : "Свързване..."}
           </h2>
           <p className="text-white/60 text-lg font-medium tracking-wide">
              {activeSubject?.name} • Разговорен режим
           </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-6 z-10">
           <button onClick={() => setVoiceMuted(!voiceMuted)} className={`p-6 rounded-full transition-all backdrop-blur-md border border-white/10 ${voiceMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {voiceMuted ? <MicOff size={32}/> : <Mic size={32}/>}
           </button>
           
           <button onClick={endVoiceCall} className="p-6 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg shadow-red-600/40 transition-all hover:scale-105 border border-red-500">
              <PhoneOff size={32}/>
           </button>
        </div>
      </div>
    );
};