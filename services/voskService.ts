import { createModel, KaldiRecognizer, Model } from 'vosk-browser';

export type VoskLanguage = 'en' | 'bg' | 'fr';

interface VoskCallbacks {
    onPartial: (text: string) => void;
    onResult: (text: string) => void;
    onError: (error: string) => void;
    onModelLoading: () => void;
    onModelLoaded: () => void;
}

class VoskSttService {
    private model: Model | null = null;
    private recognizer: KaldiRecognizer | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private currentLang: VoskLanguage | null = null;
    private isListening: boolean = false;

    // Model URLs - Using lightweight models optimized for browser
    private static MODEL_URLS: Record<VoskLanguage, string> = {
        'en': 'https://models.vosk.alphacephei.com/vosk-model-small-en-us-0.15.zip',
        'bg': 'https://models.vosk.alphacephei.com/vosk-model-small-bg-0.22.zip',
        'fr': 'https://models.vosk.alphacephei.com/vosk-model-small-fr-0.22.zip'
    };

    /**
     * Initialize or switch language model
     */
    private async loadModel(lang: VoskLanguage, callbacks: VoskCallbacks): Promise<Model> {
        if (this.model && this.currentLang === lang) {
            return this.model;
        }

        // Clean up previous model if exists
        if (this.model) {
            this.model.terminate();
            this.model = null;
        }

        callbacks.onModelLoading();
        
        try {
            const modelUrl = VoskSttService.MODEL_URLS[lang];
            // @ts-ignore - createModel types might be missing in some versions
            const model = await createModel(modelUrl);
            
            this.model = model;
            this.currentLang = lang;
            callbacks.onModelLoaded();
            return model;
        } catch (e: any) {
            console.error("Vosk Model Load Error:", e);
            throw new Error(`Failed to load voice model: ${e.message}`);
        }
    }

    /**
     * Start listening
     */
    public async start(lang: VoskLanguage, callbacks: VoskCallbacks) {
        if (this.isListening) return;

        try {
            // 1. Initialize Audio Context (Must be inside user gesture for iOS)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Resume context immediately (iOS requirement)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // 2. Load Model
            const model = await this.loadModel(lang, callbacks);

            // 3. Create Recognizer
            // We use the AudioContext's sample rate to match the hardware exactly
            this.recognizer = new model.KaldiRecognizer(this.audioContext.sampleRate);
            
            this.recognizer.on("result", (message: any) => {
                const text = message.result?.text;
                if (text) callbacks.onResult(text);
            });

            this.recognizer.on("partialresult", (message: any) => {
                const text = message.result?.partial;
                if (text) callbacks.onPartial(text);
            });

            // 4. Get Microphone Stream
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                },
                video: false
            });

            // 5. Setup Audio Processing Pipeline
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Use ScriptProcessor for broad compatibility (AudioWorklet is better but harder to bundle without config)
            // Buffer size 4096 offers a balance between latency and stability
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.recognizer || !this.isListening) return;
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Vosk expects audio buffer directly if using the browser bindings
                try {
                    // Check if recognizer is ready to accept data
                    this.recognizer.acceptWaveform(e.inputBuffer);
                } catch (err) {
                    console.error("Audio process error", err);
                }
            };

            // Connect nodes
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination); // destination is needed for ScriptProcessor to fire

            this.isListening = true;

        } catch (error: any) {
            this.cleanup();
            console.error("STT Start Error:", error);
            if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
                callbacks.onError("Microphone permission denied. Please allow access in settings.");
            } else {
                callbacks.onError("Could not start voice recognition. " + error.message);
            }
        }
    }

    /**
     * Stop listening
     */
    public stop() {
        this.isListening = false;
        this.cleanup();
    }

    public isActive() {
        return this.isListening;
    }

    private cleanup() {
        if (this.source) {
            try { this.source.disconnect(); } catch(e){}
            this.source = null;
        }
        if (this.processor) {
            try { this.processor.disconnect(); } catch(e){}
            this.processor = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.recognizer) {
            try { this.recognizer.remove(); } catch(e){}
            this.recognizer = null;
        }
        if (this.audioContext) {
            try { this.audioContext.close(); } catch(e){}
            this.audioContext = null;
        }
    }
}

export const voskService = new VoskSttService();
