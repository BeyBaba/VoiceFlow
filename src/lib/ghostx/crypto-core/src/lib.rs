// GhostX Crypto Core - Rust WASM Module
// X25519 key exchange + XChaCha20-Poly1305 AEAD + HKDF + Secure Wipe

use wasm_bindgen::prelude::*;
use x25519_dalek::{EphemeralSecret, PublicKey, StaticSecret};
use chacha20poly1305::{
    aead::{Aead, KeyInit, OsRng},
    XChaCha20Poly1305, XNonce,
};
use hkdf::Hkdf;
use sha2::Sha256;
use rand::RngCore;
use zeroize::Zeroize;

mod ratchet;
pub use ratchet::*;

// === Anahtar Uretimi ===

/// Yeni X25519 keypair uret (her oturum icin yeni, asla diske yazilmaz)
#[wasm_bindgen]
pub fn generate_keypair() -> JsValue {
    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);

    let result = serde_json::json!({
        "publicKey": public.as_bytes().to_vec(),
        "secretKey": secret.to_bytes().to_vec(),
    });

    serde_wasm_bindgen::to_value(&result).unwrap()
}

/// X25519 Diffie-Hellman paylasilan sir hesapla
#[wasm_bindgen]
pub fn derive_shared_secret(my_secret: &[u8], their_public: &[u8]) -> Vec<u8> {
    let mut secret_bytes = [0u8; 32];
    secret_bytes.copy_from_slice(my_secret);
    let secret = StaticSecret::from(secret_bytes);

    let mut public_bytes = [0u8; 32];
    public_bytes.copy_from_slice(their_public);
    let public = PublicKey::from(public_bytes);

    let shared = secret.diffie_hellman(&public);
    let result = shared.as_bytes().to_vec();

    // Gecici anahtarlari sifirla
    secret_bytes.zeroize();
    public_bytes.zeroize();

    result
}

// === HKDF Anahtar Turetme ===

/// HKDF-SHA256 ile anahtar turet
#[wasm_bindgen]
pub fn hkdf_derive(input_key: &[u8], salt: &[u8], info: &[u8], output_len: usize) -> Vec<u8> {
    let hk = Hkdf::<Sha256>::new(Some(salt), input_key);
    let mut output = vec![0u8; output_len];
    hk.expand(info, &mut output)
        .expect("HKDF expand basarisiz");
    output
}

/// HKDF ile root key ve chain key turet (Double Ratchet icin)
#[wasm_bindgen]
pub fn kdf_rk(root_key: &[u8], dh_output: &[u8]) -> JsValue {
    let hk = Hkdf::<Sha256>::new(Some(root_key), dh_output);

    let mut new_root_key = [0u8; 32];
    let mut chain_key = [0u8; 32];

    hk.expand(b"ghostx-rk", &mut new_root_key)
        .expect("HKDF RK basarisiz");
    hk.expand(b"ghostx-ck", &mut chain_key)
        .expect("HKDF CK basarisiz");

    let result = serde_json::json!({
        "rootKey": new_root_key.to_vec(),
        "chainKey": chain_key.to_vec(),
    });

    serde_wasm_bindgen::to_value(&result).unwrap()
}

/// Chain key'den mesaj anahtari ve yeni chain key turet
#[wasm_bindgen]
pub fn kdf_ck(chain_key: &[u8]) -> JsValue {
    let hk = Hkdf::<Sha256>::new(None, chain_key);

    let mut new_chain_key = [0u8; 32];
    let mut message_key = [0u8; 32];

    hk.expand(b"ghostx-chain", &mut new_chain_key)
        .expect("HKDF chain basarisiz");
    hk.expand(b"ghostx-msg", &mut message_key)
        .expect("HKDF msg basarisiz");

    let result = serde_json::json!({
        "chainKey": new_chain_key.to_vec(),
        "messageKey": message_key.to_vec(),
    });

    serde_wasm_bindgen::to_value(&result).unwrap()
}

// === Sifreleme / Cozme ===

/// XChaCha20-Poly1305 ile sifrele (AEAD)
#[wasm_bindgen]
pub fn encrypt(plaintext: &[u8], key: &[u8]) -> JsValue {
    let cipher = XChaCha20Poly1305::new_from_slice(key)
        .expect("Gecersiz anahtar uzunlugu");

    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = XNonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .expect("Sifreleme basarisiz");

    let result = serde_json::json!({
        "ciphertext": ciphertext,
        "nonce": nonce_bytes.to_vec(),
    });

    serde_wasm_bindgen::to_value(&result).unwrap()
}

/// XChaCha20-Poly1305 ile coz
#[wasm_bindgen]
pub fn decrypt(ciphertext: &[u8], key: &[u8], nonce: &[u8]) -> Result<Vec<u8>, JsValue> {
    let cipher = XChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| JsValue::from_str(&format!("Gecersiz anahtar: {}", e)))?;

    let nonce = XNonce::from_slice(nonce);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| JsValue::from_str(&format!("Cozme basarisiz: {}", e)))
}

// === Guvenli Bellek Sifirlama ===

/// Buffer'i guvenli sekilde sifirla (zeroize)
#[wasm_bindgen]
pub fn secure_wipe(mut data: Vec<u8>) -> Vec<u8> {
    data.zeroize();
    data
}

/// Rastgele byte dizisi uret
#[wasm_bindgen]
pub fn random_bytes(len: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; len];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

/// 6 haneli alfanumerik oda kodu uret
#[wasm_bindgen]
pub fn generate_room_code() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Karisik olmayanlar cikarildi (0/O, 1/I)
    let mut code = String::with_capacity(6);
    let mut bytes = [0u8; 6];
    OsRng.fill_bytes(&mut bytes);

    for &b in &bytes {
        code.push(CHARSET[(b as usize) % CHARSET.len()] as char);
    }

    code
}
