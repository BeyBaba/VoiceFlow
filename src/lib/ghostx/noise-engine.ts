// GhostX Noise Engine - Ileri Seviye Trafik Gizleme
// Traffic Padding'i WebRTC data channel'a dogrudan entegre eder
// Tum giden/gelen trafik bu katmandan gecer
//
// Katmanlar:
// [Uygulama Mesaji] -> [Noise Engine] -> [Sifreleme] -> [WebRTC Data Channel]
//
// Noise Engine ne yapar:
// 1. Gercek mesajlari sabit boyutlu paketlere sarar
// 2. Aralara sahte paketler ekler (Poisson dagilimi)
// 3. Tum paketleri ayni boyutta gonderir (boyut analizi engellenir)
// 4. Alici tarafta gercek/sahte ayristirmasi yapar
// 5. Trafik paterni analizi imkansiz hale gelir

import {
  TrafficPaddingManager,
  wrapRealMessage,
  unwrapPacket,
  generatePaddingPacket,
} from './traffic-padding';
import { encrypt, decrypt, randomBytes } from './crypto';
import type { EncryptedPayload } from './types';

// === Trafik Profilleri ===

export interface NoiseProfile {
  name: string;
  description: string;
  meanInterval: number;    // Ortalama paket arasi (ms)
  minInterval: number;
  maxInterval: number;
  burstSize: number;       // Patlama boyutu (bir seferde kac paket)
  burstProbability: number; // Patlama olasiligi (0-1)
  packetSize: number;      // Sabit paket boyutu
}

// Onceden tanimli profiller
export const NOISE_PROFILES: Record<string, NoiseProfile> = {
  // Dusuk bant genisligi - az veri kullanimi
  stealth: {
    name: 'Gizli',
    description: 'Dusuk veri kullanimi, az gurultu',
    meanInterval: 10000,
    minInterval: 5000,
    maxInterval: 30000,
    burstSize: 1,
    burstProbability: 0,
    packetSize: 256,
  },

  // Normal - dengeli
  balanced: {
    name: 'Dengeli',
    description: 'Orta seviye gurultu, iyi gizleme',
    meanInterval: 5000,
    minInterval: 2000,
    maxInterval: 15000,
    burstSize: 3,
    burstProbability: 0.1,
    packetSize: 512,
  },

  // Yuksek guvenlik - cok gurultu
  paranoid: {
    name: 'Paranoyak',
    description: 'Maksimum gurultu, en iyi gizleme, yuksek veri',
    meanInterval: 2000,
    minInterval: 500,
    maxInterval: 5000,
    burstSize: 5,
    burstProbability: 0.2,
    packetSize: 1024,
  },

  // Video chat taklidi - surekli veri akisi
  video_mimicry: {
    name: 'Video Taklidi',
    description: 'Surekli veri akisi, video gorusmesi gibi gorunur',
    meanInterval: 100,
    minInterval: 50,
    maxInterval: 200,
    burstSize: 10,
    burstProbability: 0.3,
    packetSize: 1024,
  },
};

// === Noise Engine ===

export class NoiseEngine {
  private paddingManager: TrafficPaddingManager;
  private profile: NoiseProfile;
  private encryptionKey: Uint8Array | null = null;
  private isActive: boolean = false;
  private burstTimer: ReturnType<typeof setTimeout> | null = null;

  // Istatistikler
  private stats = {
    realPacketsSent: 0,
    realPacketsReceived: 0,
    noisePacketsSent: 0,
    noisePacketsDropped: 0,
    totalBytesSent: 0,
    totalBytesReceived: 0,
    startTime: 0,
  };

  // Callback'ler
  public onSendPacket: ((packet: EncryptedPayload) => void) | null = null;
  public onRealMessageReceived: ((data: Uint8Array) => void) | null = null;

  constructor(profile: NoiseProfile = NOISE_PROFILES.balanced) {
    this.profile = profile;
    this.paddingManager = new TrafficPaddingManager({
      enabled: false,
      meanInterval: profile.meanInterval,
      minInterval: profile.minInterval,
      maxInterval: profile.maxInterval,
      packetSize: profile.packetSize,
    });
  }

  /** Noise engine'i baslat */
  start(key: Uint8Array): void {
    this.encryptionKey = key;
    this.isActive = true;
    this.stats.startTime = Date.now();

    // Padding manager'i baslat
    this.paddingManager.start(key, (packet) => {
      this.stats.noisePacketsSent++;
      this.stats.totalBytesSent += this.profile.packetSize;
      if (this.onSendPacket) {
        this.onSendPacket(packet);
      }
    });

    // Burst timer
    this.scheduleBurst();
  }

  /** Noise engine'i durdur */
  stop(): void {
    this.isActive = false;
    this.paddingManager.stop();
    this.encryptionKey = null;

    if (this.burstTimer) {
      clearTimeout(this.burstTimer);
      this.burstTimer = null;
    }
  }

  /** Gercek mesaj gonder (noise katmanina sar) */
  sendMessage(data: Uint8Array): void {
    if (!this.encryptionKey || !this.onSendPacket) return;

    // Buyuk mesajlar icin parcala
    if (data.length > this.profile.packetSize - 3) {
      this.sendLargeMessage(data);
      return;
    }

    const packet = wrapRealMessage(data, this.encryptionKey, this.profile.packetSize);
    this.onSendPacket(packet);
    this.stats.realPacketsSent++;
    this.stats.totalBytesSent += this.profile.packetSize;
  }

  /** Buyuk mesaji parcalayarak gonder */
  private sendLargeMessage(data: Uint8Array): void {
    if (!this.encryptionKey || !this.onSendPacket) return;

    const chunkSize = this.profile.packetSize - 7; // 3 header + 4 chunk header
    const totalChunks = Math.ceil(data.length / chunkSize);
    const messageId = randomBytes(2); // 2 byte = 65536 benzersiz ID

    for (let i = 0; i < totalChunks; i++) {
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);

      // Chunk header: [msgId(2)] [chunkIndex(1)] [totalChunks(1)] [data...]
      const payload = new Uint8Array(4 + chunk.length);
      payload[0] = messageId[0];
      payload[1] = messageId[1];
      payload[2] = i;
      payload[3] = totalChunks;
      payload.set(chunk, 4);

      const packet = wrapRealMessage(payload, this.encryptionKey, this.profile.packetSize);
      this.onSendPacket(packet);
      this.stats.realPacketsSent++;
      this.stats.totalBytesSent += this.profile.packetSize;
    }
  }

  /** Gelen paketi isle */
  receivePacket(encrypted: EncryptedPayload): void {
    if (!this.encryptionKey) return;

    this.stats.totalBytesReceived += this.profile.packetSize;

    const result = unwrapPacket(encrypted, this.encryptionKey);

    if (result.isReal && result.data) {
      this.stats.realPacketsReceived++;
      if (this.onRealMessageReceived) {
        this.onRealMessageReceived(result.data);
      }
    } else {
      // Sahte paket - sessizce at
      this.stats.noisePacketsDropped++;
    }
  }

  // === Burst (Patlama) Yonetimi ===

  /** Rastgele zamanlarda patlama seklinde paketler gonder */
  private scheduleBurst(): void {
    if (!this.isActive) return;

    const interval = this.profile.meanInterval * (2 + Math.random() * 3);

    this.burstTimer = setTimeout(() => {
      if (Math.random() < this.profile.burstProbability) {
        this.sendBurst();
      }
      this.scheduleBurst();
    }, interval);
  }

  /** Bir seferde birden fazla sahte paket gonder (burst) */
  private sendBurst(): void {
    if (!this.encryptionKey || !this.onSendPacket) return;

    const count = Math.floor(Math.random() * this.profile.burstSize) + 1;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.encryptionKey || !this.onSendPacket) return;
        const packet = generatePaddingPacket(this.encryptionKey, this.profile.packetSize);
        this.onSendPacket(packet);
        this.stats.noisePacketsSent++;
        this.stats.totalBytesSent += this.profile.packetSize;
      }, i * 50); // Her paket arasi 50ms
    }
  }

  // === Profil Yonetimi ===

  /** Noise profilini degistir */
  setProfile(profile: NoiseProfile): void {
    const wasActive = this.isActive;
    const key = this.encryptionKey;

    if (wasActive) this.stop();

    this.profile = profile;
    this.paddingManager = new TrafficPaddingManager({
      enabled: false,
      meanInterval: profile.meanInterval,
      minInterval: profile.minInterval,
      maxInterval: profile.maxInterval,
      packetSize: profile.packetSize,
    });

    if (wasActive && key) this.start(key);
  }

  /** Mevcut profili al */
  getProfile(): NoiseProfile {
    return this.profile;
  }

  // === Istatistikler ===

  getStats() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const totalSent = this.stats.realPacketsSent + this.stats.noisePacketsSent;

    return {
      ...this.stats,
      elapsedSeconds: Math.round(elapsed),
      noiseRatio: totalSent > 0
        ? Math.round((this.stats.noisePacketsSent / totalSent) * 100)
        : 0,
      avgBandwidthKBps: elapsed > 0
        ? Math.round(this.stats.totalBytesSent / elapsed / 1024 * 10) / 10
        : 0,
    };
  }

  /** Temizlik */
  destroy(): void {
    this.stop();
    this.onSendPacket = null;
    this.onRealMessageReceived = null;
  }
}
