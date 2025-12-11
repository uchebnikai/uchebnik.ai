import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCcw, Zap, ZapOff } from 'lucide-react';
import { TOAST_CONTAINER, TOAST_ERROR } from '../../styles/ui';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraModal = ({ onCapture, onClose }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async () => {
    setIsReady(false);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
        };
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Няма достъп до камерата. Моля, проверете разрешенията на браузъра.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Logic to crop to the center "scanner box"
      // We assume the scanner box is a square in the center of the viewport
      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      
      // Determine the smallest dimension to make a square crop
      const minDim = Math.min(videoW, videoH);
      
      // We want to capture roughly the center 80% of the smallest dimension
      // This matches visually with the overlay box (approx)
      const cropSize = minDim * 0.8; 
      
      const startX = (videoW - cropSize) / 2;
      const startY = (videoH - cropSize) / 2;

      // Limit output size for API performance (max 800x800)
      const MAX_OUTPUT = 800;
      const outputSize = Math.min(cropSize, MAX_OUTPUT);

      canvas.width = outputSize;
      canvas.height = outputSize;

      ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, outputSize, outputSize);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(dataUrl);
      onClose(); // Stop stream handled by cleanup
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
        
        {/* Controls Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                <X size={24} />
            </button>
            <div className="text-white font-bold text-sm tracking-widest uppercase bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                Scan & Solve
            </div>
            <button onClick={toggleCamera} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                <RefreshCcw size={24} />
            </button>
        </div>

        {/* Camera Viewport */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900">
            {error ? (
                <div className="text-center p-6 text-white space-y-4">
                    <p className="text-red-400">{error}</p>
                    <button onClick={() => {setError(null); startCamera();}} className="px-6 py-2 bg-white text-black rounded-full font-bold">Опитай отново</button>
                </div>
            ) : (
                <>
                    <video 
                        ref={videoRef} 
                        playsInline 
                        muted 
                        className="absolute inset-0 w-full h-full object-cover" 
                    />
                    
                    {/* Darkened Overlay with cutout */}
                    <div className="absolute inset-0 border-[60px] border-black/50 z-10 pointer-events-none transition-all duration-300">
                         {/* Corner markers for the scan area */}
                         <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl -mt-1 -ml-1"></div>
                         <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl -mt-1 -mr-1"></div>
                         <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl -mb-1 -ml-1"></div>
                         <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl -mb-1 -mr-1"></div>
                         
                         {/* Scanning Line Animation */}
                         <div className="absolute inset-x-0 h-0.5 bg-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan top-0"></div>
                         
                         <div className="absolute top-full mt-4 w-full text-center text-white/80 font-medium text-sm drop-shadow-md">
                            Позиционирай задачата в центъра
                         </div>
                    </div>
                </>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Footer */}
        <div className="p-8 pb-12 bg-black flex justify-center items-center z-20">
             <button 
                onClick={handleCapture}
                disabled={!isReady || !!error}
                className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center relative group active:scale-95 transition-all"
             >
                <div className="w-16 h-16 rounded-full bg-white group-hover:bg-indigo-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
             </button>
        </div>

        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
                animation: scan 3s linear infinite;
            }
        `}</style>
    </div>
  );
};