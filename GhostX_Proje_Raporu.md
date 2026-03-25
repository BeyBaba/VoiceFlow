# GhostX - Proje Raporu & Strateji Dokumani
### Hazirlayan: Claude AI + M.K. | Tarih: 25 Mart 2026

---

## 1. PROJE VIZYONU

GhostX, merkezi sunucusu olmayan, mesajlari RAM'de tutan, uygulama kapandiginda her seyi silen, devlet dahil kimsenin dinleyemedigi bir ozel grup chat uygulamasidir.

**Temel Felsefe:** "Uygulama kapandiginda senden geriye tek bir bit bile kalmayacak."

---

## 2. NEDEN GhostX? - PROBLEM ANALIZI

Mevcut mesajlasma uygulamalarinin sorunlari:
- **WhatsApp:** Merkezi sunucu, Facebook/Meta veri toplama, metadata gorunur
- **Telegram:** Varsayilan olarak E2EE yok, sunucu mesajlari gorebilir
- **Signal:** Merkezi sunucu var, P2P degil, telefon numarasi gerekli
- **Briar:** UI cok cirkin, video/ses destegi yok, desktop yok
- **SimpleX:** BLE/Wi-Fi yok, mesh network yok, screenshot koruma yok

GhostX tum bu sorunlari tek bir uygulamada cozer.

---

## 3. MIMARI TASARIM

### 3.1 Katmanli Baglanti Motoru
- **Internet varsa:** WebRTC P2P (sunucu mesaj gormez)
- **Internet kesilirse:** Bluetooth Low Energy (BLE) + Wi-Fi Direct
- **Mesh Network:** Internetli peer "gateway" olur, diger peer'leri tasir

### 3.2 RAM Uzerinde Calisan Sistem
- Mesajlar sadece RAM'de tutulur
- localStorage, IndexedDB, cookie, dosya sistemi YASAK
- Uygulama kapandiginda fiziksel olarak yok olur

### 3.3 Uctan Uca Sifreleme (E2EE)
- **Anahtar Degisimi:** X25519 (Curve25519)
- **Mesaj Sifreleme:** XSalsa20-Poly1305 AEAD
- **Perfect Forward Secrecy:** Double Ratchet (her mesaj ayri anahtar)
- **Anahtar Turetme:** HKDF-SHA256

### 3.4 Metadata Gizleme
- **Tor:** IP adresi tamamen gizli (Faz 3)
- **Traffic Padding:** Poisson dagilimli sahte paketler
- **Sabit Paket Boyutu:** 512 byte (boyut analizi engellenir)

---

## 4. OZELLIK LISTESI (Tum Fazlar)

### Faz 1 - Cekirdek
| Ozellik | Aciklama |
|---------|----------|
| P2P Sifreli Chat | WebRTC ile dogrudan cihazdan cihaza |
| Double Ratchet | Her mesaj icin benzersiz anahtar |
| RAM-Only Depo | Diske ASLA yazmaz |
| Panik Butonu | Ctrl+Shift+Delete ile aninda sil |
| WhatsApp UI | Koyu tema, baloncuklar, tikler, animasyonlar |
| Bluetooth + Wi-Fi | Internet olmadan da calisir |
| Kaybolan Mesajlar | 5sn/30sn/1dk/5dk timer |
| QR Kod Davet | Oda olustur + QR ile davet |

### Faz 2 - Medya & Koruma
| Ozellik | Aciklama |
|---------|----------|
| Sifreli Fotograf | 64KB chunk, RAM'de gosterilir |
| Sifreli Video | Bellekten stream, diske yazmaz |
| Ses Mesaji | Kayit + dalga formu player |
| Screenshot Engelleme | Siyah ekran + tum peer'lere uyari |
| Ekran Kaydi Tespiti | OBS, Bandicam, ShareX algilama |
| Baski Sifresi | Sahte bos chat (saldirgan hicbir sey gormez) |

### Faz 3 - Ileri Gizlilik
| Ozellik | Aciklama |
|---------|----------|
| Tor Entegrasyonu | SOCKS5 proxy, IP tamamen gizli |
| Ucucu Kimlik | 1h-3gun TTL, otomatik yenileme |
| Trafik Gizleme | 4 profil: Stealth/Balanced/Paranoid/Video Mimicry |
| Zero-Knowledge | Grup uyeligi kaniti (Schnorr NIZK) |

### Faz 4 - Tam Ozellik
| Ozellik | Aciklama |
|---------|----------|
| Mesh Network | Multi-hop routing, 10 hop TTL |
| Noise Engine | Burst pattern, Poisson dagilimi |
| Dosya Transferi | PDF, ZIP, DOCX - 100MB'a kadar |
| Grup Sesli Arama | Sifreli WebRTC audio |
| Emoji Reaksiyon | 6 hizli reaksiyon |
| Mesaj Alintilama | Reply with preview |
| Typing Indicator | "X yaziyor..." |
| Cevrimdisi Kuyruk | FIFO, 5 retry, otomatik gonderim |
| Coklu Cihaz | Cross-device sync |
| Biyometrik Kilit | Parmak izi / yuz tanima |

---

## 5. RAKIP ANALIZI

### 5.1 Bireysel Uygulama Fiyatlari

| Uygulama | Fiyat | Model |
|----------|-------|-------|
| Signal | Ucretsiz | Bagis (yillik ~$50M harciyor) |
| Briar | Ucretsiz | Hibe (OTF, NLnet, AB) |
| SimpleX | Ucretsiz | VC yatirimi ($1.3M, Jack Dorsey) |
| Threema | $3.39 tek seferlik | Ucretli uygulama + kurumsal |
| Session | Ucretsiz | Kripto token ($OXEN burn) |
| Wickr | KAPANDI (2023) | Amazon satin aldi |

### 5.2 Kurumsal Fiyatlar

| Uygulama | Fiyat | Musteriler |
|----------|-------|------------|
| Threema Work | $3/kullanici/ay | 8.000 kurumsal, 3M kullanici |
| Wire | $5-8/kullanici/ay | G7'nin 5 hukumeti, 1.800 kurumsal |
| Voxer Business | $6/kullanici/ay | Push-to-talk odakli |
| Mattermost | $10/kullanici/ay | Slack alternatifi |

### 5.3 GhostX vs Rakipler

| Ozellik | GhostX | Signal | Briar | SimpleX | Threema |
|---------|--------|--------|-------|---------|---------|
| Sunucusuz (P2P) | EVET | Hayir | EVET | Kismen | Hayir |
| RAM-only | EVET | Hayir | Hayir | Hayir | Hayir |
| BLE + Wi-Fi | EVET | Hayir | EVET | Hayir | Hayir |
| Mesh Network | EVET | Hayir | Kismen | Hayir | Hayir |
| Screenshot engel | EVET | Hayir | Hayir | Hayir | Hayir |
| Baski sifresi | EVET | Hayir | Hayir | Hayir | Hayir |
| Panik butonu | EVET | Hayir | Hayir | Hayir | Hayir |
| Trafik gizleme | EVET | Hayir | Kismen | Hayir | Hayir |
| Tor destegi | EVET | Hayir | EVET | Hayir | Hayir |
| Grup sesli arama | EVET | EVET | Hayir | Hayir | EVET |

**Sonuc:** GhostX, piyasadaki hicbir uygulamada olmayan ozellikleri bir arada sunan TEK urun.

---

## 6. RAKIPLERIN PARA KAZANMA MODELLERI

### Signal - Bagis Modeli
- Kar amaci gutmeyen vakif
- WhatsApp kurucusu Brian Acton'dan $50M faizsiz borc (2068'e kadar)
- Bireysel bagislar + vakif hibeleri
- Yillik ~$50M harcama
- SORUN: 100M kullaniciya ulasmadan surudurulemez

### Threema - Ucretli Uygulama + Kurumsal
- Bireysel: $3.39 tek seferlik
- Threema Work: ~$3/kullanici/ay
- Threema OnPrem: Ozel fiyat (sirket kendi sunucusuna kurar)
- 12M kullanici, 8.000 kurumsal musteri
- Isvicre guvenilirligi ile pazarlama

### Wire - Kurumsal Odakli
- Yillik gelir: $7.2M (2025)
- Sadece devlet ve buyuk sirketlere satiyor
- G7'nin 5 hukumeti musteri
- Toplam $53M VC yatirimi aldi
- Skype kurucusu Janus Friis yatirimci

### SimpleX - VC Destekli + Freemium
- Jack Dorsey liderliginde $1.3M pre-seed
- Yillik $660K gelir (2025, kucuk ekip)
- Community Vouchers (altyapi kredisi)
- Sunucu operatorlerine %70 gelir payi
- Freemium: temel ozellikler ucretsiz, buyuk gruplar ucretli

### Session - Kripto Token
- $OXEN token burn mekanizmasi
- Session Pro abonelik (~$5/ay)
- 1M kullanici, %3 donusum = yillik $1.12-1.68M token yakma
- Ucretli ozellikler: buyuk dosya limiti, acik grup hosting

### Briar - Tamamen Hibe
- Ticari gelir: $0
- Hibeler: Open Technology Fund ($361K), NLnet, AB
- Gonullu yonetim, acik kaynak
- SORUN: Hibeler kesilirse proje durabilir

---

## 7. GhostX PARA KAZANMA STRATEJISI

### 7.1 Open Core Model (Onerilen)

**Mantik:** Temel urun bedava + acik kaynak. Premium ozellikler KAPALI ve UCRETLI.

**Bedava (Acik Kaynak):**
- P2P sifreli metin chat
- E2EE (uctan uca sifreleme)
- RAM-only (iz birakmaz)
- Panik butonu
- Kaybolan mesajlar
- Bluetooth/Wi-Fi

**GhostX Pro ($4.99/ay veya $39.99/yil):**
- Tor entegrasyonu
- Mesh Network
- Noise Engine (trafik gizleme)
- Grup sesli arama
- Baski sifresi
- Shadow Identity
- Dosya transferi (100MB)
- Biyometrik kilit
- Coklu cihaz destegi
- Oncelikli destek

### 7.2 Kurumsal Satis

| Hedef Musteri | Neden Ihtiyaclari Var? | Fiyat |
|---------------|------------------------|-------|
| Hukuk burolari | Avukat-muvekkil gizliligi | $10/kullanici/ay |
| Gazeteciler | Kaynak koruma | $8/kullanici/ay |
| Saglik sektoru | Hasta verileri gizliligi | $12/kullanici/ay |
| Finans sirketleri | Ic iletisim guvenligi | $15/kullanici/ay |
| Savunma/guvenlik | Askeri seviye iletisim | Ozel fiyat |

### 7.3 Tahmini Gelir Projeksiyonu

| Kaynak | Hesaplama | Yillik Gelir |
|--------|-----------|-------------|
| GhostX Pro | 100K kullanici, %3 donusum, $4.99/ay | ~$180K |
| Kurumsal | 500 kullanici, $10/ay | ~$60K |
| Bagis + Hibe | GitHub Sponsors, kripto, AB hibeleri | ~$20K |
| **TOPLAM** | | **~$260K** |

### 7.4 "Acik Kaynak = Bedava" Degil!

Acik kaynaktan para kazanan sirketler:
- **Red Hat:** Linux bedava → yillik $3.4 milyar gelir
- **WordPress:** Bedava → yillik $500M+ gelir
- **GitLab:** Acik kaynak → $500M+ gelir
- **MongoDB:** Bedava veritabani → milyar dolarlik sirket

Acik kaynak = guven insa etmek + genis kullanici tabani olusturmak + premium hizmetlerle para kazanmak.

Guvenlik uygulamasinda acik kaynak ZORUNLULUK cunku insanlar kapali kaynak guvenmez. "Arka kapi var mi?" sorusu hep kalir.

---

## 8. TURKIYE'DE YASAL DURUM

### 8.1 Kripto Yonetmeligi (5809 Sayili Kanun, Madde 39)

| Yukumluluk | Aciklama |
|------------|----------|
| BTK'ya basvuru | Kriptolu haberlesme sistemi icin BTK izni gerekli |
| Sifreleme anahtarlari | Kripto anahtarlari BTK'ya teslim edilmeli |
| Degisiklik yasagi | Izinsiz yazilim degisikligi yapilamaz |
| Kamu kurumlari | Milli kripto kullanmak zorunlu |

### 8.2 5651 Sayili Internet Kanunu + OTT Duzenlemesi

| Yukumluluk | Aciklama |
|------------|----------|
| Temsilci | 1M+ kullanicida Turkiye'de temsilci zorunlu |
| Veri lokalizasyonu | Veriler Turkiye sinirlarinda saklanmali |
| Icerik kaldirma | Mahkeme karariyla zorunlu |
| OTT izni | BTK'dan yetki almak zorunlu |
| Ceza | 30 milyon TL'ye kadar para cezasi |

### 8.3 Pratikte Durum

Hukuk uzmanlari bu yonetmeligin PRATIKTE UYGULANAMAZ oldugunu soyluyor:
> "Sifreleme anahtarlarinin anlik ve islem bazli olarak kullanicilar tarafindan
> yaratilabiliyor olusu sebebiyle kesinlikle uygulanabilir degildir."
> - Serhat Koc, Kripto Yonetmeligi Elestirisi

### 8.4 Risk Analizi

| Senaryo | Risk |
|---------|------|
| Kendi aranda kullanmak (kucuk grup) | DUSUK |
| Turkiye'de yayinlamak (<1M kullanici) | ORTA |
| Turkiye'de yayinlamak (>1M kullanici) | YUKSEK |
| Sadece yurtdisindan yayinlamak | DUSUK |
| Acik kaynak GitHub'da paylasma | DUSUK |

### 8.5 Tavsiyeler
1. Gelistirmek tamamen legal
2. Kucuk grupla kullanmak pratik risk cok dusuk
3. Ticari yayinda bilisim hukuku avukati zorunlu
4. En guvenli yol: Yurtdisindan yayin (AB/Isvicre) + acik kaynak
5. Signal ve Briar zaten ayni seyi yapiyor, Turkiye'de kullaniliyor

---

## 9. TEKNIK ISTATISTIKLER

| Metrik | Deger |
|--------|-------|
| Toplam dosya | 47+ |
| Toplam kod satiri | ~8.600+ |
| Gelistirme suresi | ~2 saat |
| Planlanan sure | 4-7 hafta |
| Maliyet | $0 |
| Kullanilan diller | TypeScript, Rust |
| Framework | Next.js 16, React 19, Electron |
| Sifreleme | tweetnacl (X25519 + XSalsa20-Poly1305) |
| P2P | WebRTC (simple-peer) |
| UI | Tailwind CSS + Framer Motion |

---

## 10. SONUC

GhostX, piyasadaki hicbir uygulamada bulunmayan ozellikleri (baski sifresi, panik butonu, screenshot siyah ekran, trafik gizleme, noise engine, mesh network) tek bir urunde birlestiren, uctan uca sifreli, iz birakmayan, P2P ozel grup chat sistemidir.

Acik kaynak modeli ile guven insa ederek, premium ozellikler ve kurumsal satislarla gelir uretebilir. Turkiye'de yasal cerceve karmasik olsa da, yurtdisi yayin ve acik kaynak stratejisi ile risk minimize edilebilir.

**Proje:** github.com/BeyBaba/GhostX
**Gelistirici:** M.K. (BeyBaba)
**AI Asistan:** Claude (Anthropic)

---

*Bu dokuman 25 Mart 2026 tarihinde Claude AI tarafindan M.K. ile yapilan konusmalardan derlenmistir.*
*Hukuki bilgiler genel bilgilendirme amaclidir, avukat tavsiyesi degildir.*
