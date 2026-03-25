// GhostX Double Ratchet Implementation
// Signal Protocol benzeri, her mesaj icin benzersiz anahtar
// Perfect Forward Secrecy: Bir anahtar ele gecirilse bile diger mesajlar guvendedir

use wasm_bindgen::prelude::*;
use x25519_dalek::{PublicKey, StaticSecret};
use chacha20poly1305::{
    aead::{Aead, KeyInit, OsRng},
    XChaCha20Poly1305, XNonce,
};
use hkdf::Hkdf;
use sha2::Sha256;
use rand::RngCore;
use zeroize::Zeroize;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

const MAX_SKIP: usize = 100;
const SKIP_KEY_TTL_MS: u64 = 60_000; // 60 saniye

#[derive(Serialize, Deserialize)]
struct SkippedKeyEntry {
    key: Vec<u8>,
    timestamp: u64,
}

/// Double Ratchet oturumu
#[wasm_bindgen]
pub struct DoubleRatchetSession {
    // DH ratchet keypair'lerimiz
    dh_secret: Vec<u8>,
    dh_public: Vec<u8>,
    // Karsi tarafin DH public key'i
    dh_remote: Option<Vec<u8>>,
    // Root key
    root_key: Vec<u8>,
    // Gonderme/Alma zincir anahtarlari
    chain_key_send: Option<Vec<u8>>,
    chain_key_recv: Option<Vec<u8>>,
    // Mesaj sayaclari
    send_count: u32,
    recv_count: u32,
    prev_send_count: u32,
    // Atlanan mesaj anahtarlari
    skipped_keys: HashMap<String, SkippedKeyEntry>,
}

#[wasm_bindgen]
impl DoubleRatchetSession {
    /// Gonderici olarak baslat (ilk mesaji gonderen taraf)
    #[wasm_bindgen(constructor)]
    pub fn new_sender(shared_secret: &[u8], remote_public: &[u8]) -> DoubleRatchetSession {
        let secret = StaticSecret::random_from_rng(OsRng);
        let public = PublicKey::from(&secret);

        // Ilk DH hesapla
        let mut remote_bytes = [0u8; 32];
        remote_bytes.copy_from_slice(remote_public);
        let remote_pk = PublicKey::from(remote_bytes);
        let dh_output = secret.diffie_hellman(&remote_pk);

        // Root key ve gonderme chain key'i turet
        let hk = Hkdf::<Sha256>::new(Some(shared_secret), dh_output.as_bytes());
        let mut root_key = [0u8; 32];
        let mut chain_key = [0u8; 32];
        hk.expand(b"ghostx-rk", &mut root_key).unwrap();
        hk.expand(b"ghostx-ck", &mut chain_key).unwrap();

        DoubleRatchetSession {
            dh_secret: secret.to_bytes().to_vec(),
            dh_public: public.as_bytes().to_vec(),
            dh_remote: Some(remote_public.to_vec()),
            root_key: root_key.to_vec(),
            chain_key_send: Some(chain_key.to_vec()),
            chain_key_recv: None,
            send_count: 0,
            recv_count: 0,
            prev_send_count: 0,
            skipped_keys: HashMap::new(),
        }
    }

    /// Alici olarak baslat
    pub fn new_receiver(shared_secret: &[u8], our_secret: &[u8], our_public: &[u8]) -> DoubleRatchetSession {
        DoubleRatchetSession {
            dh_secret: our_secret.to_vec(),
            dh_public: our_public.to_vec(),
            dh_remote: None,
            root_key: shared_secret.to_vec(),
            chain_key_send: None,
            chain_key_recv: None,
            send_count: 0,
            recv_count: 0,
            prev_send_count: 0,
            skipped_keys: HashMap::new(),
        }
    }

    /// Bizim DH public key'imizi dondur
    pub fn get_public_key(&self) -> Vec<u8> {
        self.dh_public.clone()
    }

    /// Mesaj sifrele ve gonder
    pub fn ratchet_encrypt(&mut self, plaintext: &[u8]) -> JsValue {
        // Chain key'den mesaj anahtari turet
        let ck = self.chain_key_send.as_ref().expect("Send chain key yok");
        let (new_ck, msg_key) = self.kdf_chain(ck);
        self.chain_key_send = Some(new_ck);

        // XChaCha20-Poly1305 ile sifrele
        let cipher = XChaCha20Poly1305::new_from_slice(&msg_key)
            .expect("Gecersiz mesaj anahtari");
        let mut nonce_bytes = [0u8; 24];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = XNonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, plaintext)
            .expect("Sifreleme basarisiz");

        let header = serde_json::json!({
            "dh": self.dh_public,
            "pn": self.prev_send_count,
            "n": self.send_count,
        });

        self.send_count += 1;

        let result = serde_json::json!({
            "header": header,
            "ciphertext": ciphertext,
            "nonce": nonce_bytes.to_vec(),
        });

        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    /// Mesaj coz
    pub fn ratchet_decrypt(
        &mut self,
        header_dh: &[u8],
        header_pn: u32,
        header_n: u32,
        ciphertext: &[u8],
        nonce: &[u8],
    ) -> Result<Vec<u8>, JsValue> {
        // Atlanan mesaj anahtarlarinda ara
        let skip_key = format!("{}:{}", hex::encode(header_dh), header_n);
        // hex yerine basit encoding
        let skip_key = format!("{:?}:{}", &header_dh[..4], header_n);

        if let Some(entry) = self.skipped_keys.remove(&skip_key) {
            let cipher = XChaCha20Poly1305::new_from_slice(&entry.key)
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
            let nonce = XNonce::from_slice(nonce);
            return cipher.decrypt(nonce, ciphertext)
                .map_err(|e| JsValue::from_str(&e.to_string()));
        }

        // Yeni DH ratchet adimi gerekli mi?
        let need_ratchet = match &self.dh_remote {
            None => true,
            Some(remote) => remote != header_dh,
        };

        if need_ratchet {
            // Atlanan mesajlari kaydet
            if let Some(ref ck) = self.chain_key_recv {
                self.skip_message_keys(ck.clone(), self.recv_count, header_pn);
            }

            // DH ratchet adimi
            self.dh_remote = Some(header_dh.to_vec());
            self.prev_send_count = self.send_count;
            self.send_count = 0;
            self.recv_count = 0;

            // Yeni root key ve alma chain key'i hesapla
            let mut remote_bytes = [0u8; 32];
            remote_bytes.copy_from_slice(header_dh);
            let remote_pk = PublicKey::from(remote_bytes);

            let mut secret_bytes = [0u8; 32];
            secret_bytes.copy_from_slice(&self.dh_secret);
            let secret = StaticSecret::from(secret_bytes);

            let dh_output = secret.diffie_hellman(&remote_pk);

            let hk = Hkdf::<Sha256>::new(Some(&self.root_key), dh_output.as_bytes());
            let mut new_rk = [0u8; 32];
            let mut new_ck = [0u8; 32];
            hk.expand(b"ghostx-rk", &mut new_rk).unwrap();
            hk.expand(b"ghostx-ck", &mut new_ck).unwrap();
            self.root_key = new_rk.to_vec();
            self.chain_key_recv = Some(new_ck.to_vec());

            // Yeni DH keypair uret (gonderme icin)
            let new_secret = StaticSecret::random_from_rng(OsRng);
            let new_public = PublicKey::from(&new_secret);
            let dh_output2 = new_secret.diffie_hellman(&remote_pk);

            let hk2 = Hkdf::<Sha256>::new(Some(&self.root_key), dh_output2.as_bytes());
            let mut new_rk2 = [0u8; 32];
            let mut new_ck2 = [0u8; 32];
            hk2.expand(b"ghostx-rk", &mut new_rk2).unwrap();
            hk2.expand(b"ghostx-ck", &mut new_ck2).unwrap();

            self.dh_secret = new_secret.to_bytes().to_vec();
            self.dh_public = new_public.as_bytes().to_vec();
            self.root_key = new_rk2.to_vec();
            self.chain_key_send = Some(new_ck2.to_vec());

            // Gecici verileri sifirla
            secret_bytes.zeroize();
            remote_bytes.zeroize();
        }

        // Atlanan mesajlari kaydet
        let ck = self.chain_key_recv.as_ref()
            .ok_or_else(|| JsValue::from_str("Recv chain key yok"))?
            .clone();
        self.skip_message_keys(ck, self.recv_count, header_n);

        // Mesaj anahtarini turet
        let ck = self.chain_key_recv.as_ref().unwrap();
        let (new_ck, msg_key) = self.kdf_chain(ck);
        self.chain_key_recv = Some(new_ck);
        self.recv_count = header_n + 1;

        // Coz
        let cipher = XChaCha20Poly1305::new_from_slice(&msg_key)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let nonce = XNonce::from_slice(nonce);
        cipher.decrypt(nonce, ciphertext)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Tum state'i guvenli sekilde sil
    pub fn destroy(&mut self) {
        self.dh_secret.zeroize();
        self.dh_public.zeroize();
        if let Some(ref mut k) = self.dh_remote { k.zeroize(); }
        self.root_key.zeroize();
        if let Some(ref mut k) = self.chain_key_send { k.zeroize(); }
        if let Some(ref mut k) = self.chain_key_recv { k.zeroize(); }
        for (_, entry) in self.skipped_keys.iter_mut() {
            entry.key.zeroize();
        }
        self.skipped_keys.clear();
    }

    // === Dahili Yardimci Fonksiyonlar ===

    fn kdf_chain(&self, chain_key: &[u8]) -> (Vec<u8>, Vec<u8>) {
        let hk = Hkdf::<Sha256>::new(None, chain_key);
        let mut new_chain_key = [0u8; 32];
        let mut message_key = [0u8; 32];
        hk.expand(b"ghostx-chain", &mut new_chain_key).unwrap();
        hk.expand(b"ghostx-msg", &mut message_key).unwrap();
        (new_chain_key.to_vec(), message_key.to_vec())
    }

    fn skip_message_keys(&mut self, mut chain_key: Vec<u8>, start: u32, until: u32) {
        let count = (until - start) as usize;
        if count > MAX_SKIP {
            return; // Cok fazla atlama, guvenlik riski
        }

        let now = js_sys::Date::now() as u64;

        for i in start..until {
            let (new_ck, msg_key) = self.kdf_chain(&chain_key);
            let dh_ref = self.dh_remote.as_ref().unwrap_or(&self.dh_public);
            let key = format!("{:?}:{}", &dh_ref[..4], i);
            self.skipped_keys.insert(key, SkippedKeyEntry {
                key: msg_key,
                timestamp: now,
            });
            chain_key = new_ck;
        }

        self.chain_key_recv = Some(chain_key);

        // Suresi dolmus atlanan anahtarlari temizle
        self.skipped_keys.retain(|_, entry| {
            now - entry.timestamp < SKIP_KEY_TTL_MS
        });
    }
}

impl Drop for DoubleRatchetSession {
    fn drop(&mut self) {
        self.destroy();
    }
}
