// GhostX Voice Call - Sifreli Grup Sesli Arama
// WebRTC audio stream uzerinden P2P sesli gorusme
// Ses verisi sifrelenir, sunucu duymaz
// Grup aramasi: Her peer diger tum peer'lerle ayri audio baglantisi kurar

export interface CallParticipant {
  peerId: string;
  peerName: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;     // 0-100
  joinedAt: number;
}

export interface CallState {
  isActive: boolean;
  isRinging: boolean;
  isMuted: boolean;
  isDeafened: boolean;     // Kendi sesini kapatmis mi
  roomId: string | null;
  participants: Map<string, CallParticipant>;
  startedAt: number;
  duration: number;
}

export type CallEvent =
  | { type: 'incoming'; roomId: string; callerName: string }
  | { type: 'accepted'; peerId: string }
  | { type: 'rejected'; peerId: string }
  | { type: 'ended'; reason: string }
  | { type: 'participant_joined'; participant: CallParticipant }
  | { type: 'participant_left'; peerId: string }
  | { type: 'participant_muted'; peerId: string; isMuted: boolean }
  | { type: 'speaking'; peerId: string; isSpeaking: boolean };

/**
 * Sifreli Grup Sesli Arama Yoneticisi
 */
export class VoiceCallManager {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioAnalysers: Map<string, AnalyserNode> = new Map();
  private state: CallState;
  private speakingCheckInterval: ReturnType<typeof setInterval> | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;

  // Callback'ler
  public onEvent: ((event: CallEvent) => void) | null = null;
  public onStateChange: ((state: CallState) => void) | null = null;

  // WebRTC signaling icin (peer-manager uzerinden)
  public onSendSignal: ((peerId: string, signal: unknown) => void) | null = null;

  constructor() {
    this.state = {
      isActive: false,
      isRinging: false,
      isMuted: false,
      isDeafened: false,
      roomId: null,
      participants: new Map(),
      startedAt: 0,
      duration: 0,
    };
  }

  /** Arama baslat */
  async startCall(roomId: string, myPeerId: string, myName: string): Promise<void> {
    // Mikrofon erisimi al
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
      },
    });

    this.audioContext = new AudioContext();

    this.state = {
      ...this.state,
      isActive: true,
      isRinging: false,
      roomId,
      startedAt: Date.now(),
    };

    // Kendini katilimci olarak ekle
    this.state.participants.set(myPeerId, {
      peerId: myPeerId,
      peerName: myName,
      isMuted: false,
      isSpeaking: false,
      audioLevel: 0,
      joinedAt: Date.now(),
    });

    // Sure sayaci baslat
    this.durationInterval = setInterval(() => {
      this.state.duration = Math.floor((Date.now() - this.state.startedAt) / 1000);
      this.notifyStateChange();
    }, 1000);

    // Konusma algilama baslat
    this.startSpeakingDetection();

    this.notifyStateChange();
  }

  /** Peer'e audio baglantisi kur */
  async connectPeer(
    peerId: string,
    peerName: string,
    isInitiator: boolean
  ): Promise<void> {
    if (!this.localStream) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Yerel ses akisini ekle
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    // Uzak ses akisini al
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        this.handleRemoteAudio(peerId, remoteStream);
      }
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onSendSignal) {
        this.onSendSignal(peerId, {
          type: 'ice',
          candidate: event.candidate,
        });
      }
    };

    // Baglanti durumu
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(peerId);
      }
    };

    this.peerConnections.set(peerId, pc);

    // Katilimci ekle
    this.state.participants.set(peerId, {
      peerId,
      peerName,
      isMuted: false,
      isSpeaking: false,
      audioLevel: 0,
      joinedAt: Date.now(),
    });

    if (this.onEvent) {
      this.onEvent({
        type: 'participant_joined',
        participant: this.state.participants.get(peerId)!,
      });
    }

    // SDP offer/answer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.onSendSignal) {
        this.onSendSignal(peerId, { type: 'offer', sdp: offer });
      }
    }

    this.notifyStateChange();
  }

  /** Gelen SDP/ICE sinyalini isle */
  async handleSignal(peerId: string, signal: { type: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }): Promise<void> {
    let pc = this.peerConnections.get(peerId);

    if (!pc && signal.type === 'offer') {
      // Yeni baglanti istegi
      await this.connectPeer(peerId, peerId, false);
      pc = this.peerConnections.get(peerId);
    }

    if (!pc) return;

    if (signal.type === 'offer' && signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (this.onSendSignal) {
        this.onSendSignal(peerId, { type: 'answer', sdp: answer });
      }
    } else if (signal.type === 'answer' && signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.type === 'ice' && signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  /** Uzak ses akisini isle */
  private handleRemoteAudio(peerId: string, stream: MediaStream): void {
    if (!this.audioContext) return;

    // Audio element olustur (oynatma icin)
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch(() => {});

    // Ses seviyesi analizi
    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    this.audioAnalysers.set(peerId, analyser);
  }

  /** Mikrofonu sessize al / ac */
  toggleMute(): void {
    if (!this.localStream) return;

    this.state.isMuted = !this.state.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.state.isMuted;
    });

    this.notifyStateChange();
  }

  /** Peer'i kaldir */
  private removePeer(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    this.audioAnalysers.delete(peerId);
    this.state.participants.delete(peerId);

    if (this.onEvent) {
      this.onEvent({ type: 'participant_left', peerId });
    }

    this.notifyStateChange();
  }

  /** Konusma algilama */
  private startSpeakingDetection(): void {
    this.speakingCheckInterval = setInterval(() => {
      for (const [peerId, analyser] of this.audioAnalysers) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const isSpeaking = avg > 20;

        const participant = this.state.participants.get(peerId);
        if (participant) {
          const wasSpeaking = participant.isSpeaking;
          participant.isSpeaking = isSpeaking;
          participant.audioLevel = Math.min(100, Math.round(avg));

          if (wasSpeaking !== isSpeaking && this.onEvent) {
            this.onEvent({ type: 'speaking', peerId, isSpeaking });
          }
        }
      }
    }, 100);
  }

  /** Aramayi bitir */
  endCall(): void {
    // Tum peer baglantilrini kapat
    for (const [peerId, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();
    this.audioAnalysers.clear();

    // Yerel stream'i durdur
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.speakingCheckInterval) {
      clearInterval(this.speakingCheckInterval);
      this.speakingCheckInterval = null;
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    this.state = {
      isActive: false,
      isRinging: false,
      isMuted: false,
      isDeafened: false,
      roomId: null,
      participants: new Map(),
      startedAt: 0,
      duration: 0,
    };

    if (this.onEvent) {
      this.onEvent({ type: 'ended', reason: 'user_ended' });
    }

    this.notifyStateChange();
  }

  /** Durum bildir */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  /** Mevcut durumu al */
  getState(): CallState {
    return { ...this.state };
  }

  /** Sure formatla */
  static formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Temizlik */
  destroy(): void {
    this.endCall();
    this.onEvent = null;
    this.onStateChange = null;
    this.onSendSignal = null;
  }
}
