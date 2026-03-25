// GhostX Traffic Padding - Trafik Gizleme
// Gercek mesajlari sahte paketler arasinda gizler
// Disaridan bakanlar kimin ne zaman gercekten konustugunu anlayamaz
//
// Nasil calisir:
// 1. Arka planda rastgele aralikla (Poisson dagilimi) sahte sifreli paketler gonderilir
// 2. Gercek mesajlar da ayni boyut ve formatta gonderilir
// 3. Paketlerin icinde "gercek mi, sahte mi" flagi sifreli payload'da saklanir
// 4. Disaridan trafigi izleyen biri hepsini ayni gorur

import { encrypt, decrypt, randomBytes } from './crypto';
import type { EncryptedPayload } from './types';

// Paket tipleri (sifreli payload ICINDE, disaridan gorunmez)
const PACKET_TYPE_REAL = 0x01;     // Gercek mesaj
const PACKET_TYPE_PADDING = 0x00;  // Sahte paket (goz boyama)

// Sabit paket boyutu (tum paketler ayni boyutta -> boyut analizi engellenir)
const FIXED_PACKET_SIZE = 512; // byte

export interface PaddingConfig {
  enabled: boolean;
  meanInterval: number;    // Ortalama paket arasi sure (ms) - varsayilan 5000ms
  minInterval: number;     // Minimum aralik (ms)
  maxInterval: number;     // Maksimum aralik (ms)
  packetSize: number;      // Sabit paket boyutu
}

const DEFAULT_CONFIG: PaddingConfig = {
  enabled: false,
  meanInterval: 5000,      // Ortalama 5 saniye
  minInterval: 1000,       // En az 1 saniye
  maxInterval: 15000,      // En fazla 15 saniye
  packetSize: FIXED_PACKET_SIZE,
};

/**
 * Poisson dagilimina gore rastgele aralik uret
 * Lambda = 1/meanInterval
 * Dogal gorunen rastgele zamanlamalar saglar
 */
function poissonInterval(meanMs: number, minMs: number, maxMs: number): number {
  // Exponential distribution (Poisson process inter-arrival time)
  const u = Math.random();
  const interval = -meanMs * Math.log(1 - u);
  return Math.max(minMs, Math.min(maxMs, Math.round(interval)));
}

/**
 * Veriyi sabit boyuta getir (padding ekle veya kes)
 * Tum paketler ayni boyutta -> boyut analizi imkansiz
 */
function padToFixedSize(data: Uint8Array, targetSize: number): Uint8Array {
  const padded = new Uint8Array(targetSize);

  if (data.length >= targetSize) {
    // Veri buyukse kes (bu durumda chunking kullanilmali)
    padded.set(data.subarray(0, targetSize));
  } else {
    // Veri kucukse rastgele padding ekle
    padded.set(data);
    // Kalan kismi rastgele doldur (deterministik dolgu kullanilmaz, cunku
    // sifrelenmis verinin deseni analiz edilebilir)
    const padding = randomBytes(targetSize - data.length);
    padded.set(padding, data.length);
  }

  return padded;
}

/**
 * Gercek mesaji sabit boyutlu sifreli pakete cevir
 */
export function wrapRealMessage(
  messageData: Uint8Array,
  key: Uint8Array,
  packetSize: number = FIXED_PACKET_SIZE
): EncryptedPayload {
  // [1 byte tip] [2 byte gercek veri uzunlugu] [veri] [padding]
  const payload = new Uint8Array(packetSize);
  payload[0] = PACKET_TYPE_REAL;

  // Gercek veri uzunlugunu kaydet (Big Endian)
  const dataLen = Math.min(messageData.length, packetSize - 3);
  payload[1] = (dataLen >> 8) & 0xFF;
  payload[2] = dataLen & 0xFF;

  // Gercek veriyi kopyala
  payload.set(messageData.subarray(0, dataLen), 3);

  // Kalan kismi rastgele doldur
  if (3 + dataLen < packetSize) {
    const padding = randomBytes(packetSize - 3 - dataLen);
    payload.set(padding, 3 + dataLen);
  }

  // Sifrele
  return encrypt(payload, key);
}

/**
 * Sahte paket olustur (disaridan gercek paketten ayirt edilemez)
 */
export function generatePaddingPacket(
  key: Uint8Array,
  packetSize: number = FIXED_PACKET_SIZE
): EncryptedPayload {
  const payload = new Uint8Array(packetSize);
  payload[0] = PACKET_TYPE_PADDING;

  // Tamamen rastgele veri (sahte)
  const fakeData = randomBytes(packetSize - 1);
  payload.set(fakeData, 1);

  // Sifrele (disaridan gercek paket ile ayni gorunur)
  return encrypt(payload, key);
}

/**
 * Gelen paketi coz: Gercek mesaj mi, sahte paket mi?
 */
export function unwrapPacket(
  encrypted: EncryptedPayload,
  key: Uint8Array
): { isReal: boolean; data: Uint8Array | null } {
  try {
    const decrypted = decrypt(encrypted.ciphertext, encrypted.nonce, key);

    const packetType = decrypted[0];

    if (packetType === PACKET_TYPE_REAL) {
      // Gercek mesaj - veri uzunlugunu oku
      const dataLen = (decrypted[1] << 8) | decrypted[2];
      const data = decrypted.slice(3, 3 + dataLen);
      return { isReal: true, data };
    }

    // Sahte paket - sessizce at
    return { isReal: false, data: null };
  } catch {
    // Cozme hatasi - paket bozuk veya yanlis anahtar
    return { isReal: false, data: null };
  }
}

/**
 * Traffic Padding Manager
 * Arka planda sahte paketler gonderir
 */
export class TrafficPaddingManager {
  private config: PaddingConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isRunning: boolean = false;
  private sendCallback: ((packet: EncryptedPayload) => void) | null = null;
  private encryptionKey: Uint8Array | null = null;

  // Istatistikler
  private stats = {
    paddingPacketsSent: 0,
    realPacketsSent: 0,
    totalBytesSent: 0,
  };

  constructor(config?: Partial<PaddingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Trafik gizlemeyi baslat
   * @param key Sifreleme anahtari
   * @param sendFn Paket gonderme fonksiyonu (WebRTC data channel'a gonderir)
   */
  start(key: Uint8Array, sendFn: (packet: EncryptedPayload) => void): void {
    this.encryptionKey = key;
    this.sendCallback = sendFn;
    this.isRunning = true;
    this.config.enabled = true;

    this.scheduleNextPadding();
  }

  /**
   * Trafik gizlemeyi durdur
   */
  stop(): void {
    this.isRunning = false;
    this.config.enabled = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.sendCallback = null;
    this.encryptionKey = null;
  }

  /**
   * Gercek mesaj gonder (padding ile sarmalanmis)
   */
  sendReal(messageData: Uint8Array): void {
    if (!this.encryptionKey || !this.sendCallback) return;

    const packet = wrapRealMessage(messageData, this.encryptionKey, this.config.packetSize);
    this.sendCallback(packet);
    this.stats.realPacketsSent++;
    this.stats.totalBytesSent += this.config.packetSize;
  }

  /**
   * Sonraki sahte paketi zamanla
   */
  private scheduleNextPadding(): void {
    if (!this.isRunning) return;

    const interval = poissonInterval(
      this.config.meanInterval,
      this.config.minInterval,
      this.config.maxInterval
    );

    this.timer = setTimeout(() => {
      this.sendPaddingPacket();
      this.scheduleNextPadding();
    }, interval);
  }

  /**
   * Sahte paket gonder
   */
  private sendPaddingPacket(): void {
    if (!this.encryptionKey || !this.sendCallback) return;

    const packet = generatePaddingPacket(this.encryptionKey, this.config.packetSize);
    this.sendCallback(packet);
    this.stats.paddingPacketsSent++;
    this.stats.totalBytesSent += this.config.packetSize;
  }

  /**
   * Konfigurasyon guncelle
   */
  updateConfig(config: Partial<PaddingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Istatistikleri al
   */
  getStats(): typeof this.stats & { paddingRatio: number } {
    const total = this.stats.paddingPacketsSent + this.stats.realPacketsSent;
    return {
      ...this.stats,
      paddingRatio: total > 0 ? this.stats.paddingPacketsSent / total : 0,
    };
  }

  /**
   * Her seyi temizle
   */
  destroy(): void {
    this.stop();
    this.stats.paddingPacketsSent = 0;
    this.stats.realPacketsSent = 0;
    this.stats.totalBytesSent = 0;
  }
}
