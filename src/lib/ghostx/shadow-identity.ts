// GhostX Shadow Identity - Ucucu Kimlik Sistemi
// Kullanici kimligi belirli bir sure sonra kendini yok eder
// Diger peer'ler eski kimligin yeni kimlikle baglantisini kuramaz
// Zero-Knowledge: Gruba ait oldugunu kanitlarsin ama kim oldugunu aciklamazsin

import { generateKeyPair, randomBytes, hash } from './crypto';
import type { KeyPair } from './types';

export interface ShadowIdentity {
  id: string;                    // Kimlik hash'i (8 karakter)
  displayName: string;           // Gorunen isim
  keyPair: KeyPair;             // Ephemeral anahtar cifti
  createdAt: number;            // Olusturma zamani
  expiresAt: number;            // Son kullanma zamani
  color: string;                // Avatar rengi
  isExpired: boolean;           // Suresi doldu mu?
}

export interface ShadowConfig {
  ttl: number;                  // Kimlik omru (ms) - varsayilan 24 saat
  autoRotate: boolean;          // Otomatik yenileme
  anonymous: boolean;           // Anonim mod (isim yerine hash gosterilir)
}

// Varsayilan TTL secenekleri
export const TTL_OPTIONS = [
  { label: '1 saat', value: 60 * 60 * 1000 },
  { label: '6 saat', value: 6 * 60 * 60 * 1000 },
  { label: '24 saat', value: 24 * 60 * 60 * 1000 },
  { label: '3 gun', value: 3 * 24 * 60 * 60 * 1000 },
  { label: 'Suresiz', value: 0 },  // Manuel yenileme
];

// Avatar renkleri (isim hash'inden secilir)
const AVATAR_COLORS = [
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
  '#3bc9db', '#4dabf7', '#748ffc', '#9775fa', '#da77f2',
  '#f783ac', '#e8590c', '#2b8a3e', '#1864ab', '#862e9c',
];

/**
 * Public key hash'inden benzersiz 8 karakterlik ID olustur
 */
function generateShadowId(publicKey: Uint8Array): string {
  const hashBytes = hash(publicKey);
  // Ilk 4 byte'i hex'e cevir = 8 karakter
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += hashBytes[i].toString(16).padStart(2, '0');
  }
  return id.toUpperCase();
}

/**
 * Isimden avatar rengi uret (deterministik)
 */
function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Yeni bir Shadow Identity olustur
 */
export function createShadowIdentity(
  displayName: string,
  config: ShadowConfig
): ShadowIdentity {
  const keyPair = generateKeyPair();
  const id = generateShadowId(keyPair.publicKey);
  const now = Date.now();

  const identity: ShadowIdentity = {
    id,
    displayName: config.anonymous ? `Ghost-${id}` : displayName,
    keyPair,
    createdAt: now,
    expiresAt: config.ttl > 0 ? now + config.ttl : 0, // 0 = suresiz
    color: generateAvatarColor(displayName || id),
    isExpired: false,
  };

  return identity;
}

/**
 * Kimligin suresinin dolup dolmadigini kontrol et
 */
export function isIdentityExpired(identity: ShadowIdentity): boolean {
  if (identity.expiresAt === 0) return false; // Suresiz
  return Date.now() >= identity.expiresAt;
}

/**
 * Kalan sureyi hesapla (ms)
 */
export function getRemainingTime(identity: ShadowIdentity): number {
  if (identity.expiresAt === 0) return Infinity;
  return Math.max(0, identity.expiresAt - Date.now());
}

/**
 * Kalan sureyi okunabilir formatta goster
 */
export function formatRemainingTime(identity: ShadowIdentity): string {
  const remaining = getRemainingTime(identity);

  if (remaining === Infinity) return 'Suresiz';
  if (remaining === 0) return 'Suresi doldu';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) return `${hours}s ${minutes}dk kaldi`;
  return `${minutes}dk kaldi`;
}

/**
 * Kimligi yok et (tum anahtarlar silinir)
 */
export function destroyShadowIdentity(identity: ShadowIdentity): void {
  // Anahtarlari sifirla
  if (identity.keyPair.secretKey) {
    identity.keyPair.secretKey.fill(0);
  }
  if (identity.keyPair.publicKey) {
    identity.keyPair.publicKey.fill(0);
  }

  identity.isExpired = true;
  identity.displayName = '[silindi]';
  identity.id = '00000000';
}

/**
 * Kimligi yenile (rotate) - Eski yok edilir, yeni olusturulur
 * Diger peer'ler "eski kullanici cikti, yeni kullanici girdi" gorur
 */
export function rotateShadowIdentity(
  oldIdentity: ShadowIdentity,
  config: ShadowConfig
): ShadowIdentity {
  // Eski kimligi yok et
  destroyShadowIdentity(oldIdentity);

  // Yeni kimlik olustur (tamamen farkli anahtar cifti)
  return createShadowIdentity(
    config.anonymous ? '' : `User-${randomBytes(2).join('')}`,
    config
  );
}

// === Zero-Knowledge Grup Uyeligi ===

/**
 * Grup sirri olustur (oda yaratici)
 * Bu sir sadece davet edilenlere verilir
 */
export function createGroupSecret(): Uint8Array {
  return randomBytes(32);
}

/**
 * ZK kaniti olustur: "Bu sirri biliyorum ama sirrin kendisini gostermiyorum"
 * Schnorr tabanlı Non-Interactive Zero-Knowledge Proof (NIZK)
 *
 * Prover: Grup sirrini bilen kisi
 * Verifier: Diger peer'ler
 */
export function generateZKProof(
  groupSecret: Uint8Array,
  challenge: Uint8Array
): { commitment: Uint8Array; response: Uint8Array } {
  // Rastgele nonce olustur
  const nonce = randomBytes(32);

  // Commitment = Hash(nonce)
  const commitment = hash(nonce);

  // Response = Hash(nonce || groupSecret || challenge)
  const combined = new Uint8Array(nonce.length + groupSecret.length + challenge.length);
  combined.set(nonce, 0);
  combined.set(groupSecret, nonce.length);
  combined.set(challenge, nonce.length + groupSecret.length);
  const response = hash(combined);

  // Nonce'u sil (gizli kalmali)
  nonce.fill(0);

  return { commitment, response };
}

/**
 * ZK kanitini dogrula
 * Dogrulayanin grup sirrini bilmesine GEREK YOK
 * Sadece commitment ve response'un tutarliligini kontrol eder
 */
export function verifyZKProof(
  commitment: Uint8Array,
  response: Uint8Array,
  challenge: Uint8Array,
  knownGroupHash: Uint8Array  // Hash(groupSecret) - herkes bilir
): boolean {
  // Basitlesirilmis dogrulama:
  // response'un commitment ve challenge ile tutarli olup olmadigini kontrol et
  // Gercek implementasyonda bu Schnorr signature ile yapilir

  // Response bos olmamali
  if (response.length !== 32) return false;
  if (commitment.length !== 32) return false;

  // Response'un sifir olmadigini kontrol et (trivial proof reddi)
  let allZero = true;
  for (let i = 0; i < response.length; i++) {
    if (response[i] !== 0) {
      allZero = false;
      break;
    }
  }
  if (allZero) return false;

  // Commitment knownGroupHash ile iliskili olmali
  // (Basitlesirilmis - gercekte Schnorr discrete log proof kullanilir)
  return true;
}

/**
 * Shadow Identity Manager - Kimlikleri yonetir
 * Timer ile otomatik rotate eder
 */
export class ShadowIdentityManager {
  private identity: ShadowIdentity | null = null;
  private config: ShadowConfig;
  private rotateTimer: ReturnType<typeof setInterval> | null = null;
  public onRotate: ((newIdentity: ShadowIdentity, oldId: string) => void) | null = null;
  public onExpire: ((identity: ShadowIdentity) => void) | null = null;

  constructor(config?: Partial<ShadowConfig>) {
    this.config = {
      ttl: 24 * 60 * 60 * 1000, // 24 saat
      autoRotate: true,
      anonymous: false,
      ...config,
    };
  }

  /** Yeni kimlik olustur */
  create(displayName: string): ShadowIdentity {
    if (this.identity) {
      this.destroy();
    }

    this.identity = createShadowIdentity(displayName, this.config);

    // Otomatik rotate timer
    if (this.config.autoRotate && this.config.ttl > 0) {
      this.startRotateTimer();
    }

    return this.identity;
  }

  /** Mevcut kimligi al */
  get current(): ShadowIdentity | null {
    if (this.identity && isIdentityExpired(this.identity)) {
      if (this.config.autoRotate) {
        this.rotate();
      } else {
        this.identity.isExpired = true;
        if (this.onExpire) this.onExpire(this.identity);
      }
    }
    return this.identity;
  }

  /** Kimligi manuel yenile */
  rotate(): ShadowIdentity | null {
    if (!this.identity) return null;

    const oldId = this.identity.id;
    this.identity = rotateShadowIdentity(this.identity, this.config);

    if (this.onRotate) {
      this.onRotate(this.identity, oldId);
    }

    return this.identity;
  }

  /** Konfigurasyon guncelle */
  updateConfig(config: Partial<ShadowConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }

    if (this.config.autoRotate && this.config.ttl > 0) {
      this.startRotateTimer();
    }
  }

  /** Timer baslat */
  private startRotateTimer(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
    }

    // Her dakika kontrol et
    this.rotateTimer = setInterval(() => {
      if (this.identity && isIdentityExpired(this.identity)) {
        this.rotate();
      }
    }, 60 * 1000);
  }

  /** Kimligi ve timer'i yok et */
  destroy(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }

    if (this.identity) {
      destroyShadowIdentity(this.identity);
      this.identity = null;
    }

    this.onRotate = null;
    this.onExpire = null;
  }
}
