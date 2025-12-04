export type VoskLanguage = 'en' | 'bg' | 'fr';

interface VoskCallbacks {
    onPartial: (text: string) => void;
    onResult: (text: string) => void;
    onError: (error: string) => void;
    onModelLoading: () => void;
    onModelLoaded: () => void;
}

class NativeSttService {
    private recognizer: any = null;
    private isListening: boolean = false;
    private shouldRestart: boolean = false; // Flag to handle manual continuous loop
    private callbacks: VoskCallbacks | null = null;
    private lang: string = 'bg-BG';

    /**
     * Start listening using the Native Web Speech API
     * Note: This must NOT be async to satisfy iOS Safari user-gesture requirements.
     */
    public start(lang: VoskLanguage, callbacks: VoskCallbacks) {
        if (this.isListening) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            callbacks.onError("Brauzerut ne poddarzha glasovo razpoznavane.");
            return;
        }

        this.callbacks = callbacks;

        const langMap: Record<VoskLanguage, string> = {
            'en': 'en-US',
            'bg': 'bg-BG',
            'fr': 'fr-FR'
        };
        this.lang = langMap[lang] || 'bg-BG';

        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // iOS Safari Logic: 
        // 1. Continuous must be false (Safari bugs out with true).
        // 2. We CANNOT auto-restart on iOS because start() requires a user gesture.
        // Therefore, on iOS, it's one-shot (stops after silence). User must tap again.
        this.shouldRestart = !isIOS; 

        this.startRecognizer();
    }

    private startRecognizer() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        try {
            this.recognizer = new SpeechRecognition();
            this.recognizer.lang = this.lang;
            
            // Continuous is true for Desktop/Android to allow long dictation.
            // False for iOS to prevent errors and ensure stability.
            this.recognizer.continuous = this.shouldRestart; 
            
            this.recognizer.interimResults = true;
            this.recognizer.maxAlternatives = 1;

            this.recognizer.onstart = () => {
                this.isListening = true;
                this.callbacks?.onModelLoaded();
            };

            this.recognizer.onerror = (event: any) => {
                // 'no-speech' is common and harmless
                if (event.error !== 'no-speech') {
                    // For any real error, stop the loop to prevent spam
                    this.shouldRestart = false; 
                    this.isListening = false;
                }

                console.error("STT Error:", event.error);

                if (event.error === 'not-allowed') {
                    this.callbacks?.onError("Dostaput do mikrofona e otkazan.");
                } else if (event.error === 'service-not-allowed') {
                    // This happens if we try to restart too fast or without user gesture on iOS
                    this.callbacks?.onError("Greshka: service-not-allowed. Opitayte otnovo.");
                } else if (event.error === 'no-speech') {
                    // Ignore
                } else {
                    this.callbacks?.onError(`Greshka: ${event.error}`);
                }
            };

            this.recognizer.onend = () => {
                this.isListening = false;
                
                // Only restart if we are in continuous mode (Desktop/Android)
                // AND we haven't encountered a blocking error.
                if (this.shouldRestart) {
                    try {
                        setTimeout(() => {
                             if (this.shouldRestart) this.startRecognizer();
                        }, 100);
                    } catch(e) {
                        this.shouldRestart = false;
                    }
                } else {
                    // On iOS, we just stop. The UI will show the mic is off.
                    // This is the correct behavior to avoid service-not-allowed.
                }
            };

            this.recognizer.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript && this.callbacks) {
                    this.callbacks.onResult(finalTranscript);
                }
                if (interimTranscript && this.callbacks) {
                    this.callbacks.onPartial(interimTranscript);
                }
            };

            // Notify loading
            this.callbacks?.onModelLoading();
            
            this.recognizer.start();

        } catch (e: any) {
            this.isListening = false;
            this.shouldRestart = false;
            this.callbacks?.onError(e.message || "Failed to start");
        }
    }

    /**
     * Stop listening
     */
    public stop() {
        this.shouldRestart = false; // Break the loop
        if (this.recognizer) {
            try {
                this.recognizer.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
        }
        this.isListening = false;
    }

    public isActive() {
        return this.isListening || this.shouldRestart;
    }
}

export const voskService = new NativeSttService();