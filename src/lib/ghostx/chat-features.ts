// GhostX Chat Features - Ileri Chat Ozellikleri
// Emoji reaksiyon, mesaj alintilama, typing indicator, cevrimdisi kuyruk

import { generateMessageId } from './crypto';

// === EMOJI REAKSIYON ===

export interface EmojiReaction {
  emoji: string;
  reactorId: string;
  reactorName: string;
  timestamp: number;
}

export interface MessageReaction {
  messageId: string;
  reactions: Map<string, EmojiReaction[]>; // emoji -> reaktor listesi
}

// Hizli reaksiyon emojileri (WhatsApp stili)
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Mesaja reaksiyon ekle/kaldir
 */
export function toggleReaction(
  reactions: Map<string, EmojiReaction[]>,
  emoji: string,
  reactorId: string,
  reactorName: string
): Map<string, EmojiReaction[]> {
  const updated = new Map(reactions);
  const existing = updated.get(emoji) || [];

  // Ayni kullanici zaten reaksiyon verdiyse kaldir
  const alreadyReacted = existing.findIndex(r => r.reactorId === reactorId);

  if (alreadyReacted >= 0) {
    existing.splice(alreadyReacted, 1);
    if (existing.length === 0) {
      updated.delete(emoji);
    } else {
      updated.set(emoji, existing);
    }
  } else {
    // Yeni reaksiyon ekle
    existing.push({
      emoji,
      reactorId,
      reactorName,
      timestamp: Date.now(),
    });
    updated.set(emoji, existing);
  }

  return updated;
}

/**
 * Reaksiyon mesajini serialize et (peer'lere gondermek icin)
 */
export function serializeReaction(messageId: string, emoji: string, action: 'add' | 'remove'): string {
  return JSON.stringify({
    _type: 'reaction',
    messageId,
    emoji,
    action,
  });
}

// === MESAJ ALINTILAMA (REPLY) ===

export interface QuotedMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;         // Ilk 100 karakter
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
}

/**
 * Mesaji alinti icin hazirla
 */
export function createQuote(
  messageId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text'
): QuotedMessage {
  return {
    id: messageId,
    senderId,
    senderName,
    content: type === 'text'
      ? content.substring(0, 100) + (content.length > 100 ? '...' : '')
      : type === 'image' ? '📷 Fotograf'
      : type === 'video' ? '🎥 Video'
      : type === 'voice' ? '🎤 Ses mesaji'
      : '📎 Dosya',
    type,
  };
}

// === TYPING INDICATOR ===

export interface TypingState {
  peerId: string;
  peerName: string;
  startedAt: number;
}

const TYPING_TIMEOUT = 5000; // 5 saniye hareketsizlik = yazmak bitiyor

export class TypingManager {
  private typingPeers: Map<string, TypingState> = new Map();
  private myTypingTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  public onChange: ((typingPeers: TypingState[]) => void) | null = null;
  public onSendTyping: ((isTyping: boolean) => void) | null = null;

  constructor() {
    // Eski typing state'leri temizle
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [peerId, state] of this.typingPeers) {
        if (now - state.startedAt > TYPING_TIMEOUT) {
          this.typingPeers.delete(peerId);
          changed = true;
        }
      }

      if (changed) this.notifyChange();
    }, 1000);
  }

  /** Ben yaziyorum (her tuslamayla cagirilir) */
  imTyping(): void {
    // Debounce: Son tuslama + 3 saniye sonra "durdum" gonder
    if (this.myTypingTimer) {
      clearTimeout(this.myTypingTimer);
    } else {
      // Ilk tuslama - "yaziyorum" gonder
      if (this.onSendTyping) this.onSendTyping(true);
    }

    this.myTypingTimer = setTimeout(() => {
      // 3 saniye tuslamadim - "durdum" gonder
      if (this.onSendTyping) this.onSendTyping(false);
      this.myTypingTimer = null;
    }, 3000);
  }

  /** Ben yazmayı durdurdum (mesaj gonderildi) */
  imDoneTyping(): void {
    if (this.myTypingTimer) {
      clearTimeout(this.myTypingTimer);
      this.myTypingTimer = null;
    }
    if (this.onSendTyping) this.onSendTyping(false);
  }

  /** Peer yaziyor bildirimi geldi */
  peerIsTyping(peerId: string, peerName: string): void {
    this.typingPeers.set(peerId, {
      peerId,
      peerName,
      startedAt: Date.now(),
    });
    this.notifyChange();
  }

  /** Peer yazmayi birakti */
  peerStoppedTyping(peerId: string): void {
    this.typingPeers.delete(peerId);
    this.notifyChange();
  }

  /** Yazan peer'lerin listesi */
  getTypingPeers(): TypingState[] {
    return Array.from(this.typingPeers.values());
  }

  /** "X yaziyor..." metni */
  getTypingText(): string {
    const peers = this.getTypingPeers();
    if (peers.length === 0) return '';
    if (peers.length === 1) return `${peers[0].peerName} yaziyor...`;
    if (peers.length === 2) return `${peers[0].peerName} ve ${peers[1].peerName} yaziyor...`;
    return `${peers[0].peerName} ve ${peers.length - 1} kisi yaziyor...`;
  }

  /** Typing mesajini serialize et */
  static serialize(isTyping: boolean): string {
    return JSON.stringify({
      _type: 'typing',
      isTyping,
    });
  }

  /** Temizlik */
  destroy(): void {
    if (this.myTypingTimer) clearTimeout(this.myTypingTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.typingPeers.clear();
    this.onChange = null;
    this.onSendTyping = null;
  }

  private notifyChange(): void {
    if (this.onChange) {
      this.onChange(this.getTypingPeers());
    }
  }
}

// === CEVRIMDISI MESAJ KUYRUGU ===

export interface QueuedMessage {
  id: string;
  roomId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  mediaData?: Uint8Array;
  mediaMimeType?: string;
  quotedMessage?: QuotedMessage;
  disappearAfter?: number;
  timestamp: number;
  retryCount: number;
}

/**
 * Cevrimdisi Mesaj Kuyrugu
 * Internet yokken mesajlari RAM'de kuyruklar
 * Baglanti gelince siraya gonderir
 */
export class OfflineQueue {
  private queue: QueuedMessage[] = [];
  private isOnline: boolean = true;
  private processingTimer: ReturnType<typeof setInterval> | null = null;

  public onProcessMessage: ((msg: QueuedMessage) => Promise<boolean>) | null = null;
  public onQueueChange: ((queueSize: number) => void) | null = null;

  constructor() {
    // Kuyrugu periyodik olarak isle
    this.processingTimer = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    }, 2000);
  }

  /** Mesaji kuyruga ekle */
  enqueue(msg: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): void {
    this.queue.push({
      ...msg,
      id: generateMessageId(),
      timestamp: Date.now(),
      retryCount: 0,
    });

    if (this.onQueueChange) this.onQueueChange(this.queue.length);

    // Online ise hemen isle
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /** Baglanti durumu degisti */
  setOnline(online: boolean): void {
    this.isOnline = online;
    if (online && this.queue.length > 0) {
      this.processQueue();
    }
  }

  /** Kuyrugu isle */
  private async processQueue(): Promise<void> {
    if (!this.onProcessMessage || this.queue.length === 0) return;

    // FIFO - ilk mesajdan basla
    const msg = this.queue[0];

    try {
      const success = await this.onProcessMessage(msg);

      if (success) {
        // Basarili - kuyruktan cikar
        this.queue.shift();
        if (this.onQueueChange) this.onQueueChange(this.queue.length);
      } else {
        // Basarisiz - retry sayacini artir
        msg.retryCount++;
        if (msg.retryCount >= 5) {
          // 5 denemeden sonra vazgec
          this.queue.shift();
          if (this.onQueueChange) this.onQueueChange(this.queue.length);
        }
      }
    } catch {
      // Hata - sonra tekrar dene
      msg.retryCount++;
    }
  }

  /** Kuyruk boyutu */
  get size(): number {
    return this.queue.length;
  }

  /** Temizlik */
  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    // Kuyrukta medya verisi varsa sifirla
    for (const msg of this.queue) {
      if (msg.mediaData) msg.mediaData.fill(0);
    }
    this.queue = [];
    this.onProcessMessage = null;
    this.onQueueChange = null;
  }
}

// === COKLU CIHAZ DESTEGI ===

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'web' | 'mobile';
  lastSeen: number;
  isCurrentDevice: boolean;
}

/**
 * Coklu Cihaz Yoneticisi
 * Ayni kimlikle birden fazla cihazdan giris
 * Her cihaz icin ayri Double Ratchet oturumu
 */
export class MultiDeviceManager {
  private devices: Map<string, DeviceInfo> = new Map();
  private currentDeviceId: string;

  public onDeviceChange: ((devices: DeviceInfo[]) => void) | null = null;

  constructor() {
    // Benzersiz cihaz ID olustur
    this.currentDeviceId = generateMessageId();
  }

  /** Bu cihazi kaydet */
  registerCurrentDevice(name: string, type: 'desktop' | 'web' | 'mobile'): DeviceInfo {
    const device: DeviceInfo = {
      deviceId: this.currentDeviceId,
      deviceName: name,
      deviceType: type,
      lastSeen: Date.now(),
      isCurrentDevice: true,
    };

    this.devices.set(this.currentDeviceId, device);
    this.notifyChange();
    return device;
  }

  /** Baska cihaz goruldu */
  peerDeviceDiscovered(deviceId: string, name: string, type: 'desktop' | 'web' | 'mobile'): void {
    this.devices.set(deviceId, {
      deviceId,
      deviceName: name,
      deviceType: type,
      lastSeen: Date.now(),
      isCurrentDevice: false,
    });
    this.notifyChange();
  }

  /** Cihaz listesi */
  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  /** Bu cihazin ID'si */
  getCurrentDeviceId(): string {
    return this.currentDeviceId;
  }

  /** Serialize */
  static serializeDeviceInfo(device: DeviceInfo): string {
    return JSON.stringify({
      _type: 'device_info',
      ...device,
    });
  }

  private notifyChange(): void {
    if (this.onDeviceChange) {
      this.onDeviceChange(this.getDevices());
    }
  }

  destroy(): void {
    this.devices.clear();
    this.onDeviceChange = null;
  }
}

// === BIYOMETRIK KILIT (Electron + Web) ===

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'pin' | 'none';
  lockTimeout: number;    // Otomatik kilit suresi (ms)
}

/**
 * Biyometrik Kilit Yoneticisi
 * Web: WebAuthn API (parmak izi / yuz tanima)
 * Electron: OS native biyometrik (Touch ID, Windows Hello)
 */
export class BiometricLock {
  private config: BiometricConfig;
  private isLocked: boolean = false;
  private lastActivity: number = Date.now();
  private lockTimer: ReturnType<typeof setInterval> | null = null;

  public onLock: (() => void) | null = null;
  public onUnlock: (() => void) | null = null;

  constructor(config?: Partial<BiometricConfig>) {
    this.config = {
      enabled: false,
      type: 'none',
      lockTimeout: 5 * 60 * 1000, // 5 dakika
      ...config,
    };
  }

  /** Biyometrik destegin var mi? */
  async isAvailable(): Promise<boolean> {
    // Web: WebAuthn API kontrolu
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    }

    // Electron: OS native biyometrik
    if (typeof window !== 'undefined' && 'ghostx' in window) {
      return true; // Electron'da her zaman mevcut (PIN fallback)
    }

    return false;
  }

  /** Biyometrik dogrulama yap */
  async authenticate(): Promise<boolean> {
    if (!this.config.enabled) {
      this.isLocked = false;
      return true;
    }

    try {
      // WebAuthn ile dogrulama
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'GhostX', id: window.location.hostname },
            user: {
              id: new Uint8Array(16),
              name: 'ghostx-user',
              displayName: 'GhostX User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },   // ES256
              { alg: -257, type: 'public-key' },  // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });

        if (credential) {
          this.isLocked = false;
          this.lastActivity = Date.now();
          if (this.onUnlock) this.onUnlock();
          return true;
        }
      }
    } catch {
      // Biyometrik basarisiz
    }

    return false;
  }

  /** Otomatik kilit timer baslat */
  startAutoLock(): void {
    this.lockTimer = setInterval(() => {
      if (this.config.enabled && !this.isLocked) {
        if (Date.now() - this.lastActivity > this.config.lockTimeout) {
          this.lock();
        }
      }
    }, 10000); // Her 10 saniye kontrol
  }

  /** Kilitle */
  lock(): void {
    this.isLocked = true;
    if (this.onLock) this.onLock();
  }

  /** Aktivite bildir (kilidi geciktir) */
  reportActivity(): void {
    this.lastActivity = Date.now();
  }

  /** Kilitli mi? */
  get locked(): boolean {
    return this.isLocked;
  }

  /** Ayarlari guncelle */
  updateConfig(config: Partial<BiometricConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Temizlik */
  destroy(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = null;
    }
    this.onLock = null;
    this.onUnlock = null;
  }
}
