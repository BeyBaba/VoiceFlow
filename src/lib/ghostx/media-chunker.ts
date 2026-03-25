// GhostX Media Chunker - Sifreli Medya Parcalama & Birlestirme
// Fotograf ve videolari 64KB parcalara boler, her parcayi ayri sifreler
// Tum islemler RAM'de yapilir, diske ASLA yazilmaz

import { encrypt, decrypt, randomBytes, generateMessageId } from './crypto';
import type { EncryptedPayload } from './types';

const CHUNK_SIZE = 64 * 1024; // 64KB

export interface MediaChunk {
  mediaId: string;
  chunkIndex: number;
  totalChunks: number;
  encrypted: EncryptedPayload;
  mimeType: string;
  fileName?: string;
  totalSize: number;
}

export interface MediaTransfer {
  mediaId: string;
  mimeType: string;
  fileName?: string;
  totalSize: number;
  totalChunks: number;
  receivedChunks: Map<number, Uint8Array>;
  startedAt: number;
}

// === Gonderme: Medyayi parcala ve sifrele ===

/**
 * Dosyayi sifreli parcalara bol
 * @param data - Ham dosya verisi (Uint8Array, RAM'de)
 * @param mimeType - Dosya tipi (image/jpeg, video/mp4, audio/webm vb.)
 * @param key - Sifreleme anahtari (32 byte)
 * @param fileName - Opsiyonel dosya adi
 * @returns Sifreli parcalar dizisi
 */
export function chunkAndEncrypt(
  data: Uint8Array,
  mimeType: string,
  key: Uint8Array,
  fileName?: string
): MediaChunk[] {
  const mediaId = generateMessageId();
  const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
  const chunks: MediaChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, data.length);
    const chunkData = data.slice(start, end);

    const encrypted = encrypt(chunkData, key);

    chunks.push({
      mediaId,
      chunkIndex: i,
      totalChunks,
      encrypted,
      mimeType,
      fileName,
      totalSize: data.length,
    });
  }

  return chunks;
}

/**
 * Tek bir parcayi JSON'a serialize et (WebRTC uzerinden gondermek icin)
 */
export function serializeChunk(chunk: MediaChunk): string {
  return JSON.stringify({
    mediaId: chunk.mediaId,
    ci: chunk.chunkIndex,
    tc: chunk.totalChunks,
    ct: Array.from(chunk.encrypted.ciphertext),
    n: Array.from(chunk.encrypted.nonce),
    mt: chunk.mimeType,
    fn: chunk.fileName,
    ts: chunk.totalSize,
  });
}

/**
 * JSON'dan parcayi deserialize et
 */
export function deserializeChunk(json: string): MediaChunk {
  const data = JSON.parse(json);
  return {
    mediaId: data.mediaId,
    chunkIndex: data.ci,
    totalChunks: data.tc,
    encrypted: {
      ciphertext: new Uint8Array(data.ct),
      nonce: new Uint8Array(data.n),
    },
    mimeType: data.mt,
    fileName: data.fn,
    totalSize: data.ts,
  };
}

// === Alma: Parcalari topla ve birlestir ===

export class MediaReceiver {
  private transfers: Map<string, MediaTransfer> = new Map();
  public onComplete: ((mediaId: string, data: Uint8Array, mimeType: string, fileName?: string) => void) | null = null;
  public onProgress: ((mediaId: string, received: number, total: number) => void) | null = null;

  /**
   * Gelen sifreli parcayi isle
   */
  receiveChunk(chunk: MediaChunk, key: Uint8Array): void {
    // Transfer kaydi olustur veya getir
    if (!this.transfers.has(chunk.mediaId)) {
      this.transfers.set(chunk.mediaId, {
        mediaId: chunk.mediaId,
        mimeType: chunk.mimeType,
        fileName: chunk.fileName,
        totalSize: chunk.totalSize,
        totalChunks: chunk.totalChunks,
        receivedChunks: new Map(),
        startedAt: Date.now(),
      });
    }

    const transfer = this.transfers.get(chunk.mediaId)!;

    // Parcayi coz
    try {
      const decrypted = decrypt(
        chunk.encrypted.ciphertext,
        chunk.encrypted.nonce,
        key
      );
      transfer.receivedChunks.set(chunk.chunkIndex, decrypted);
    } catch {
      // Cozme hatasi - parcayi atla
      return;
    }

    // Ilerleme bildirimi
    if (this.onProgress) {
      this.onProgress(
        chunk.mediaId,
        transfer.receivedChunks.size,
        transfer.totalChunks
      );
    }

    // Tum parcalar geldi mi?
    if (transfer.receivedChunks.size === transfer.totalChunks) {
      this.assembleAndDeliver(chunk.mediaId);
    }
  }

  /**
   * Tum parcalari birlestir ve teslim et
   */
  private assembleAndDeliver(mediaId: string): void {
    const transfer = this.transfers.get(mediaId);
    if (!transfer) return;

    // Parcalari sirala ve birlestir
    const assembled = new Uint8Array(transfer.totalSize);
    let offset = 0;

    for (let i = 0; i < transfer.totalChunks; i++) {
      const chunk = transfer.receivedChunks.get(i);
      if (!chunk) return; // Eksik parca

      assembled.set(chunk, offset);
      offset += chunk.length;
    }

    // Teslim et
    if (this.onComplete) {
      this.onComplete(mediaId, assembled, transfer.mimeType, transfer.fileName);
    }

    // Transfer kaydini temizle
    this.transfers.delete(mediaId);
  }

  /**
   * Bekleyen tum transferleri sil (panik)
   */
  destroy(): void {
    this.transfers.clear();
    this.onComplete = null;
    this.onProgress = null;
  }
}

// === Yardimci: Dosya okuma (RAM'e) ===

/**
 * File nesnesini Uint8Array'e cevir (RAM'de tutar)
 */
export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Uint8Array'den gosterim icin Blob URL olustur
 * ONEMLI: Component unmount olunca URL.revokeObjectURL() cagrilmali!
 */
export function createBlobUrl(data: Uint8Array, mimeType: string): string {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Blob URL'i serbest birak (bellek temizligi)
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}
