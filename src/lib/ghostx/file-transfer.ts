// GhostX File Transfer - Sifreli Dosya Gonderimi
// PDF, ZIP, DOCX vb. her turlu dosya sifreli olarak gonderilir
// RAM'de isleniri, diske yazilmaz
// Buyuk dosyalar 64KB parcalara bolunur

import { chunkAndEncrypt, MediaReceiver, fileToUint8Array, createBlobUrl, revokeBlobUrl } from './media-chunker';
import { generateMessageId } from './crypto';

// Desteklenen dosya tipleri ve ikonlari
export const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📽️',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
  'text/plain': '📃',
  'text/csv': '📊',
  'application/json': '📋',
  'application/xml': '📋',
};

export interface FileMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  icon: string;
  extension: string;
}

export interface FileTransferProgress {
  fileId: string;
  fileName: string;
  progress: number;       // 0-100
  bytesTransferred: number;
  totalBytes: number;
  speed: number;          // bytes/sec
  eta: number;            // tahmini kalan sure (saniye)
}

/**
 * Dosya boyutunu okunabilir formata cevir
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Dosya uzantisini al
 */
function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

/**
 * Dosya ikonunu al
 */
function getFileIcon(mimeType: string): string {
  return FILE_ICONS[mimeType] || '📎';
}

/**
 * Dosya metadata'sini olustur
 */
export function createFileMetadata(file: File): FileMetadata {
  return {
    id: generateMessageId(),
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    icon: getFileIcon(file.type),
    extension: getExtension(file.name),
  };
}

/**
 * Dosya Transfer Yoneticisi
 * Gonderme ve alma islemlerini yonetir
 */
export class FileTransferManager {
  private receiver: MediaReceiver;
  private activeTransfers: Map<string, {
    startTime: number;
    lastUpdate: number;
    bytesTransferred: number;
    totalBytes: number;
    fileName: string;
  }> = new Map();

  public onFileReceived: ((metadata: FileMetadata, data: Uint8Array) => void) | null = null;
  public onProgress: ((progress: FileTransferProgress) => void) | null = null;

  constructor() {
    this.receiver = new MediaReceiver();

    this.receiver.onComplete = (mediaId, data, mimeType, fileName) => {
      if (this.onFileReceived) {
        const metadata: FileMetadata = {
          id: mediaId,
          fileName: fileName || 'dosya',
          mimeType,
          fileSize: data.length,
          icon: getFileIcon(mimeType),
          extension: getExtension(fileName || ''),
        };
        this.onFileReceived(metadata, data);
      }
      this.activeTransfers.delete(mediaId);
    };

    this.receiver.onProgress = (mediaId, received, total) => {
      const transfer = this.activeTransfers.get(mediaId);
      if (!transfer || !this.onProgress) return;

      const now = Date.now();
      const elapsed = (now - transfer.startTime) / 1000;
      const bytesTransferred = Math.round((received / total) * transfer.totalBytes);
      const speed = elapsed > 0 ? bytesTransferred / elapsed : 0;
      const remaining = transfer.totalBytes - bytesTransferred;
      const eta = speed > 0 ? remaining / speed : 0;

      transfer.bytesTransferred = bytesTransferred;
      transfer.lastUpdate = now;

      this.onProgress({
        fileId: mediaId,
        fileName: transfer.fileName,
        progress: Math.round((received / total) * 100),
        bytesTransferred,
        totalBytes: transfer.totalBytes,
        speed,
        eta,
      });
    };
  }

  /**
   * Dosya gonder (sifreli parcalara bol)
   */
  async sendFile(
    file: File,
    key: Uint8Array,
    sendChunk: (chunkJson: string) => void
  ): Promise<FileMetadata> {
    const data = await fileToUint8Array(file);
    const metadata = createFileMetadata(file);

    const chunks = chunkAndEncrypt(data, file.type || 'application/octet-stream', key, file.name);

    // Transfer kaydini olustur
    this.activeTransfers.set(metadata.id, {
      startTime: Date.now(),
      lastUpdate: Date.now(),
      bytesTransferred: 0,
      totalBytes: file.size,
      fileName: file.name,
    });

    // Parcalari gonder
    for (let i = 0; i < chunks.length; i++) {
      const chunkJson = JSON.stringify({
        mediaId: metadata.id,
        ci: chunks[i].chunkIndex,
        tc: chunks[i].totalChunks,
        ct: Array.from(chunks[i].encrypted.ciphertext),
        n: Array.from(chunks[i].encrypted.nonce),
        mt: chunks[i].mimeType,
        fn: chunks[i].fileName,
        ts: chunks[i].totalSize,
      });

      sendChunk(chunkJson);

      // Ilerleme guncelle
      if (this.onProgress) {
        this.onProgress({
          fileId: metadata.id,
          fileName: file.name,
          progress: Math.round(((i + 1) / chunks.length) * 100),
          bytesTransferred: Math.round(((i + 1) / chunks.length) * file.size),
          totalBytes: file.size,
          speed: 0,
          eta: 0,
        });
      }
    }

    return metadata;
  }

  /**
   * Dosya indir (RAM'den Blob URL olustur)
   * NOT: URL kullanildiktan sonra revokeBlobUrl() ile serbest birakilmali
   */
  downloadToMemory(data: Uint8Array, mimeType: string): string {
    return createBlobUrl(data, mimeType);
  }

  /**
   * Blob URL'i serbest birak
   */
  releaseDownload(url: string): void {
    revokeBlobUrl(url);
  }

  /** Temizlik */
  destroy(): void {
    this.receiver.destroy();
    this.activeTransfers.clear();
    this.onFileReceived = null;
    this.onProgress = null;
  }
}

// Maksimum dosya boyutu (100MB - RAM siniri)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Dosya boyutu kontrolu
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya boyutu cok buyuk (${formatFileSize(file.size)}). Maksimum: ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }
  return { valid: true };
}
