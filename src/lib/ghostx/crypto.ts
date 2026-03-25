// GhostX Crypto Layer - TypeScript wrapper
// Rust WASM modulu hazir olana kadar libsodium-wrappers-sumo kullanir
// Uretimde Rust WASM ile degistirilecek

import type { KeyPair, EncryptedPayload } from './types';

let sodium: typeof import('libsodium-wrappers-sumo') | null = null;
let isReady = false;

/**
 * Kripto motorunu baslat
 * Uygulama baslarken bir kez cagirilir
 */
export async function initCrypto(): Promise<void> {
  if (isReady) return;

  const _sodium = await import('libsodium-wrappers-sumo');
  await _sodium.ready;
  sodium = _sodium;
  isReady = true;
}

function getSodium() {
  if (!sodium || !isReady) {
    throw new Error('Crypto henuz baslatilmadi. initCrypto() cagirin.');
  }
  return sodium;
}

// === Anahtar Uretimi ===

/** Yeni X25519 keypair uret (ephemeral, her oturum yeni) */
export function generateKeyPair(): KeyPair {
  const s = getSodium();
  const kp = s.crypto_kx_keypair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.privateKey,
  };
}

/** X25519 DH ile paylasilan sir hesapla */
export function deriveSharedSecret(
  mySecretKey: Uint8Array,
  theirPublicKey: Uint8Array
): Uint8Array {
  const s = getSodium();
  return s.crypto_scalarmult(mySecretKey, theirPublicKey);
}

// === HKDF Anahtar Turetme ===

/** HKDF-SHA256 ile anahtar turet */
export function hkdfDerive(
  inputKey: Uint8Array,
  salt: Uint8Array,
  info: string,
  outputLen: number = 32
): Uint8Array {
  const s = getSodium();
  // libsodium'da HKDF yok, crypto_generichash kullanarak simule ediyoruz
  const prk = s.crypto_generichash(32, inputKey, salt);
  const output = s.crypto_generichash(outputLen, new Uint8Array([...prk, ...new TextEncoder().encode(info)]));
  return output;
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

// === Sifreleme / Cozme (XChaCha20-Poly1305 AEAD) ===

/** Mesaji sifrele */
export function encrypt(plaintext: Uint8Array, key: Uint8Array): EncryptedPayload {
  const s = getSodium();
  const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    null,  // additional data
    null,  // nsec (kullanilmiyor)
    nonce,
    key
  );
  return { ciphertext, nonce };
}

/** Sifreli mesaji coz */
export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Uint8Array {
  const s = getSodium();
  return s.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,       // nsec
    ciphertext,
    null,       // additional data
    nonce,
    key
  );
}

/** String'i sifrele (convenience) */
export function encryptString(text: string, key: Uint8Array): EncryptedPayload {
  return encrypt(new TextEncoder().encode(text), key);
}

/** Sifreli veriyi string'e coz (convenience) */
export function decryptToString(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): string {
  const plaintext = decrypt(ciphertext, nonce, key);
  return new TextDecoder().decode(plaintext);
}

// === Guvenli Bellek Sifirlama ===

/** Buffer'i guvenli sekilde sifirla - sodium.memzero */
export function secureWipe(buffer: Uint8Array): void {
  const s = getSodium();
  s.memzero(buffer);
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
  const s = getSodium();
  return s.randombytes_buf(length);
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
