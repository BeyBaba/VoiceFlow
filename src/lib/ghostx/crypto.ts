// GhostX Crypto Layer - tweetnacl (saf JavaScript, WASM gerektirmez)
// X25519 anahtar degisimi + XSalsa20-Poly1305 AEAD sifreleme
// tweetnacl tamamen denetlenmis, tarayici ve Node.js'te calisir

import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import type { KeyPair, EncryptedPayload } from './types';

let isReady = false;

/**
 * Kripto motorunu baslat
 * tweetnacl saf JS oldugu icin aninda hazir
 */
export async function initCrypto(): Promise<void> {
  isReady = true;
}

// === Anahtar Uretimi ===

/** Yeni X25519 keypair uret (ephemeral, her oturum yeni) */
export function generateKeyPair(): KeyPair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
  };
}

/** X25519 DH ile paylasilan sir hesapla */
export function deriveSharedSecret(
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  return nacl.box.before(theirPublicKey, mySecretKey);
}

// === HKDF Anahtar Turetme ===

/** HMAC-SHA512 tabanli hash (HKDF yerine) */
function hmacHash(key: Uint8Array, data: Uint8Array): Uint8Array {
  // nacl.hash = SHA-512
  const combined = new Uint8Array(key.length + data.length);
  combined.set(key, 0);
  combined.set(data, key.length);
  return nacl.hash(combined).subarray(0, 32); // Ilk 32 byte
}

/** HKDF benzeri anahtar turetme */
export function hkdfDerive(
  inputKey: Uint8Array,
  salt: Uint8Array,
  info: string,
  outputLen: number = 32
): Uint8Array {
  const infoBytes = decodeUTF8(info);
  const prk = hmacHash(salt, inputKey);
  const okm = hmacHash(prk, infoBytes);
  return okm.subarray(0, outputLen);
}

/** Hash fonksiyonu (SHA-512, ilk 32 byte) */
export function hash(data: Uint8Array): Uint8Array {
  return nacl.hash(data).subarray(0, 32);
}

/** Root key ve chain key turet (Double Ratchet icin) */
export function kdfRootKey(
  rootKey: Uint8Array,
  dhOutput: Uint8Array
): { rootKey: Uint8Array; chainKey: Uint8Array } {
  const newRootKey = hkdfDerive(dhOutput, rootKey, 'ghostx-rk', 32);
  const chainKey = hkdfDerive(dhOutput, rootKey, 'ghostx-ck', 32);
  return { rootKey: newRootKey, chainKey };
}

/** Chain key'den mesaj anahtari ve yeni chain key turet */
export function kdfChainKey(
  chainKey: Uint8Array
): { chainKey: Uint8Array; messageKey: Uint8Array } {
  const newChainKey = hkdfDerive(chainKey, new Uint8Array(32), 'ghostx-chain', 32);
  const messageKey = hkdfDerive(chainKey, new Uint8Array(32), 'ghostx-msg', 32);
  return { chainKey: newChainKey, messageKey };
}

// === Sifreleme / Cozme (XSalsa20-Poly1305) ===

/** Mesaji sifrele */
export function encrypt(plaintext: Uint8Array, key: Uint8Array): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength); // 24 bytes
  const ciphertext = nacl.secretbox(plaintext, nonce, key);
  return { ciphertext, nonce };
}

/** Sifreli mesaji coz */
export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
  if (!plaintext) {
    throw new Error('Cozme basarisiz: Yanlis anahtar veya bozuk veri');
  }
  return plaintext;
}

/** String'i sifrele (convenience) */
export function encryptString(text: string, key: Uint8Array): EncryptedPayload {
  return encrypt(decodeUTF8(text), key);
}

/** Sifreli veriyi string'e coz (convenience) */
export function decryptToString(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): string {
  const plaintext = decrypt(ciphertext, nonce, key);
  return encodeUTF8(plaintext);
}

// === Guvenli Bellek Sifirlama ===

/** Buffer'i guvenli sekilde sifirla */
export function secureWipe(buffer: Uint8Array): void {
  buffer.fill(0);
  // Ek onlem: rastgele degerlerle yaz, sonra tekrar sifirla
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.random() * 256 | 0;
  }
  buffer.fill(0);
}

/** Birden fazla buffer'i sifirla */
export function secureWipeAll(...buffers: (Uint8Array | null | undefined)[]): void {
  for (const buf of buffers) {
    if (buf) secureWipe(buf);
  }
}

/** KeyPair'i guvenli sekilde sil */
export function wipeKeyPair(kp: KeyPair): void {
  secureWipe(kp.publicKey);
  secureWipe(kp.secretKey);
}

// === Yardimci Fonksiyonlar ===

/** Rastgele byte dizisi uret */
export function randomBytes(length: number): Uint8Array {
  return nacl.randomBytes(length);
}

/** 6 haneli alfanumerik oda kodu uret */
export function generateRoomCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += charset[bytes[i] % charset.length];
  }
  return code;
}

/** Benzersiz mesaj ID uret */
export function generateMessageId(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Peer ID uret (8 karakter hex) */
export function generatePeerId(): string {
  const bytes = randomBytes(4);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
