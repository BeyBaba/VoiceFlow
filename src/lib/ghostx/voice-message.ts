// GhostX Voice Message - Sifreli Ses Mesaji
// Ses kaydi RAM'de tutulur, diske ASLA yazilmaz
// Sifreli parcali transfer (media-chunker kullanir)

import { chunkAndEncrypt, type MediaChunk } from './media-chunker';

export interface VoiceRecording {
  data: Uint8Array;
  duration: number;      // saniye
  mimeType: string;
  waveform: number[];    // Dalga formu (UI gosterim icin)
}

/**
 * Ses kaydi baslat ve bitir
 * Kayit RAM'de tutulur, diske yazilmaz
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private waveformData: number[] = [];
  private waveformInterval: ReturnType<typeof setInterval> | null = null;
  private stream: MediaStream | null = null;

  /** Kaydi baslat */
  async start(): Promise<void> {
    this.audioChunks = [];
    this.waveformData = [];

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    // Dalga formu analizi icin AudioContext
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // Dalga formu verisi topla (UI icin)
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.waveformInterval = setInterval(() => {
      if (this.analyser) {
        this.analyser.getByteTimeDomainData(dataArray);
        // Ortalama ses seviyesini al
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += Math.abs(dataArray[i] - 128);
        }
        this.waveformData.push(Math.round((sum / dataArray.length) * 2));
      }
    }, 100);

    // Kaydi baslat
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.startTime = Date.now();
    this.mediaRecorder.start(100); // Her 100ms'de chunk al
  }

  /** Kaydi durdur ve sonucu dondur */
  async stop(): Promise<VoiceRecording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Kayit baslatilmadi'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const mimeType = this.mediaRecorder!.mimeType;

        // Blob'u Uint8Array'e cevir (RAM'de)
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const buffer = await blob.arrayBuffer();
        const data = new Uint8Array(buffer);

        // Temizlik
        this.cleanup();

        resolve({
          data,
          duration,
          mimeType,
          waveform: this.waveformData.slice(),
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /** Kaydi iptal et */
  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /** Kayit suresi (saniye) */
  get duration(): number {
    if (this.startTime === 0) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /** Kayit yapiliyor mu? */
  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /** Guncel dalga formu verisi */
  get currentWaveform(): number[] {
    return this.waveformData;
  }

  /** Temizlik */
  private cleanup(): void {
    if (this.waveformInterval) {
      clearInterval(this.waveformInterval);
      this.waveformInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * Ses kaydini sifreli parcalara bol (gondermek icin)
 */
export function encryptVoiceMessage(
  recording: VoiceRecording,
  key: Uint8Array
): { chunks: MediaChunk[]; waveform: number[]; duration: number } {
  const chunks = chunkAndEncrypt(
    recording.data,
    recording.mimeType,
    key,
    `voice-${Date.now()}.webm`
  );

  return {
    chunks,
    waveform: recording.waveform,
    duration: recording.duration,
  };
}
