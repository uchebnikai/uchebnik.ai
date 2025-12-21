
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audio';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
// User requested "gemini-2.5-flash-native-audio-dialog" but guidelines map native audio to:
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const playTTS = async (text: string, voiceName: string = 'Puck'): Promise<void> => {
  const apiKey = process.env.API_KEY || "";
  if (!apiKey) throw new Error("No API Key");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);
      
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1
      );
      
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputNode);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  constructor(private voiceName: string = 'Puck', private systemInstruction: string = "") {
    const apiKey = process.env.API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(
    onStatusChange: (status: 'listening' | 'speaking' | 'processing') => void,
    onClose: () => void,
    onError: (err: any) => void
  ) {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure contexts are running (needed for some browsers)
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    const sessionPromise = this.ai.live.connect({
      model: LIVE_MODEL,
      callbacks: {
        onopen: () => {
          console.log("Live Session Open");
          onStatusChange('listening');
          
          if (!this.inputAudioContext || !this.stream) return;

          const source = this.inputAudioContext.createMediaStreamSource(this.stream);
          this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          this.scriptProcessor.onaudioprocess = (e) => {
            if (!this.session) return; // Wait for session resolution
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          
          source.connect(this.scriptProcessor);
          this.scriptProcessor.connect(this.inputAudioContext.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (audioData && this.outputAudioContext) {
            onStatusChange('speaking');
            
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            
            const audioBuffer = await decodeAudioData(
              decode(audioData),
              this.outputAudioContext,
              24000,
              1
            );
            
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => {
                this.sources.delete(source);
                if (this.sources.size === 0) onStatusChange('listening');
            });
            
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          if (msg.serverContent?.interrupted) {
            this.stopAudio();
            this.nextStartTime = 0;
            onStatusChange('listening');
          }
        },
        onclose: (e) => {
          console.log("Live Session Closed");
          onClose();
        },
        onerror: (e) => {
          console.error("Live Session Error", e);
          onError(e);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } },
        },
        systemInstruction: this.systemInstruction || "You are a helpful assistant.",
      },
    });

    this.session = await sessionPromise;
  }

  private stopAudio() {
    for (const source of this.sources) {
      try { source.stop(); } catch(e) {}
    }
    this.sources.clear();
  }

  disconnect() {
    this.stopAudio();
    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor.onaudioprocess = null;
    }
    if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
    }
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    if (this.session) {
        // session.close() is not explicitly in the interface examples but good practice if available
        // The guidelines say: "When the conversation is finished, use `session.close()`"
        try { this.session.close(); } catch(e) {}
    }
  }
}
