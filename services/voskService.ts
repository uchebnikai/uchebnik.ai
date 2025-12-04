
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

    /**
     * Start listening using the Native Web Speech API
     */
    public async start(lang: VoskLanguage, callbacks: VoskCallbacks) {
        if (this.isListening) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            callbacks.onError("Brauzerut ne poddarzha glasovo razpoznavane (Web Speech API).");
            return;
        }

        try {
            this.recognizer = new SpeechRecognition();
            
            // Map Vosk language codes to BCP 47 tags
            const langMap: Record<VoskLanguage, string> = {
                'en': 'en-US',
                'bg': 'bg-BG',
                'fr': 'fr-FR'
            };
            
            this.recognizer.lang = langMap[lang] || 'bg-BG';
            this.recognizer.continuous = true;
            this.recognizer.interimResults = true;

            this.recognizer.onstart = () => {
                this.isListening = true;
                // Instant load
                callbacks.onModelLoaded(); 
            };

            this.recognizer.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    callbacks.onError("Molya, razreshete dostapa do mikrofona.");
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech errors usually
                } else {
                    callbacks.onError(`Greshka: ${event.error}`);
                }
            };

            this.recognizer.onend = () => {
                this.isListening = false;
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

                if (finalTranscript) {
                    callbacks.onResult(finalTranscript);
                }
                if (interimTranscript) {
                    callbacks.onPartial(interimTranscript);
                }
            };

            // Mimic loading state briefly for UX consistency (optional, but keeps interface same)
            callbacks.onModelLoading();
            
            this.recognizer.start();

        } catch (e: any) {
            console.error("STT Start Error:", e);
            callbacks.onError(e.message || "Failed to start recognition");
        }
    }

    /**
     * Stop listening
     */
    public stop() {
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
        return this.isListening;
    }
}

// Export as same name to maintain compatibility with App.tsx imports
export const voskService = new NativeSttService();
