
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
        this.shouldRestart = true; // Intention to listen continuously

        const langMap: Record<VoskLanguage, string> = {
            'en': 'en-US',
            'bg': 'bg-BG',
            'fr': 'fr-FR'
        };
        this.lang = langMap[lang] || 'bg-BG';

        this.startRecognizer();
    }

    private startRecognizer() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        try {
            this.recognizer = new SpeechRecognition();
            this.recognizer.lang = this.lang;
            
            // CRITICAL FIX FOR iOS: 
            // 1. continuous = false (Safari fails often with true)
            // 2. We restart manually in onend to simulate continuous
            this.recognizer.continuous = false; 
            this.recognizer.interimResults = true;
            this.recognizer.maxAlternatives = 1;

            this.recognizer.onstart = () => {
                this.isListening = true;
                this.callbacks?.onModelLoaded();
            };

            this.recognizer.onerror = (event: any) => {
                // If we get an error, we generally stop restarting to prevent infinite error loops
                // EXCEPT for 'no-speech' which just means silence
                if (event.error !== 'no-speech') {
                    this.shouldRestart = false; 
                    this.isListening = false;
                }

                console.error("STT Error:", event.error);

                if (event.error === 'not-allowed') {
                    this.callbacks?.onError("Dostaput do mikrofona e otkazan.");
                } else if (event.error === 'service-not-allowed') {
                    this.callbacks?.onError("Greshka: service-not-allowed. Proverete dali Diktuvane (Dictation) e aktivirano v nastroykite.");
                } else if (event.error === 'no-speech') {
                    // Ignore, let logic restart it
                } else {
                    this.callbacks?.onError(`Greshka: ${event.error}`);
                }
            };

            this.recognizer.onend = () => {
                this.isListening = false;
                // Manual Continuous Loop
                if (this.shouldRestart) {
                    try {
                        // Small delay to prevent CPU thrashing if it fails instantly
                        setTimeout(() => {
                             if (this.shouldRestart) this.startRecognizer();
                        }, 100);
                    } catch(e) {
                        this.shouldRestart = false;
                    }
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

// Export as same name to maintain compatibility with App.tsx imports
export const voskService = new NativeSttService();
