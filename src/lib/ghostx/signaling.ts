// GhostX Client-Side Signaling
// Signaling server ile iletisim kurarak WebRTC baglantilarini baslatir

import type { SignalMessage, SignalType } from './types';

type SignalHandler = (signal: SignalMessage) => void;

export class SignalingClient {
  private eventSource: EventSource | null = null;
  private roomId: string;
  private peerId: string;
  private peerName: string;
  private onSignal: SignalHandler;
  private isConnected = false;
  private baseUrl: string;

  constructor(
    roomId: string,
    peerId: string,
    peerName: string,
    onSignal: SignalHandler
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.peerName = peerName;
    this.onSignal = onSignal;
    this.baseUrl = '/api/ghostx/signal';
  }

  /** SSE baglantisi ac ve sinyalleri dinle */
  connect(): void {
    if (this.isConnected) return;

    const url = `${this.baseUrl}?roomId=${encodeURIComponent(this.roomId)}&peerId=${encodeURIComponent(this.peerId)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          this.isConnected = true;
          return;
        }
        this.onSignal(data as SignalMessage);
      } catch {
        // Parse hatasi, gec
      }
    };

    this.eventSource.onerror = () => {
      // Otomatik yeniden baglanma (EventSource bunu yapar)
      this.isConnected = false;
    };
  }

  /** Sinyal gonder (SDP offer/answer veya ICE candidate) */
  async sendSignal(type: SignalType, payload: unknown): Promise<void> {
    await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: this.roomId,
        peerId: this.peerId,
        peerName: this.peerName,
        type,
        payload: JSON.stringify(payload),
        timestamp: Date.now(),
      }),
    });
  }

  /** Baglanti kapat */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
