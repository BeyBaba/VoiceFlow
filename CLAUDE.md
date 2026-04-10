# VoiceFlow - Claude Code Kurallari (v2.12 uyumlu)

## SESSION BASLANGIC
- Her yeni session'da "Global CLAUDE.md v2.12 aktif" bildir
- Her session'da evrensel kurallari cek: `curl -s https://raw.githubusercontent.com/BeyBaba/BSA-Starter/main/GLOBAL_CLAUDE_MD.md`
- Erisilemezse kullaniciyi bildir, session'a devam et ama uyar

## KRITIK (Asla ihlal etme)
1. **Otomatik PR** - Claude otomatik PR olusturur ama asla onaysız merge etmez. Kullaniciya "merge edeyim mi?" diye SORAR — Kullanıcı YAP derse ancak yapabilir. Sadece sonucu bildir: "PR #X olusturuldu Kullanıcı izni ile  merge edildi yada sonraya bırakıldı Devam Ediyorum"
2. **main/master korumasi** - main'e direkt push YASAK. Her zaman claude/ branch → PR → merge akişı şeklinde DEVAM EDİLİR. Merge ancak Kullanıcının izni alındıktan sonra olur.
3. **PR zorunlulugu** - main'e direkt push yok, PR uzerinden merge. Proje kurali "sormadan merge yapma" diyorsa SOR.
4. **Test sonrasi push** - Syntax/bracket kontrolu yapilmadan push yapma
5. **Gizli dosya korumasi** - .env, .env.local, .env.*.local, credentials, API key ASLA commit edilmez. .gitignore'da mutlaka olmali.
6. **Placeholder yasak** - Kullaniciya verilen komutlarda ASLA placeholder birakma ({VERSION}, {OZET} gibi). Her seferinde gercek degerleri DOLDURULMUS olarak ver. Istisna: shell variable (${PROJE_ADI}).
7. **Kullaniciya komut verirken PowerShell formati** - Kullaniciya terminal komutu verilecekse HER ZAMAN Windows PowerShell formati kullan. Ornek: `rm -rf` degil `Remove-Item -Recurse`. Claude kendi ortaminda (WSL/Linux) bash kullanabilir ama kullaniciya verilen komutlar PowerShell olmali.
8. **Token guvenligi Önemli** - Ama; Token gerektiginde kullaniciya terminalde calistirmasi icin komut ver ama kullanıcı verdiğin komut başarılı olmazsa Kullanıcı chat'e yazabilir. Sen dosyaya yazma, CLAUDE.md'ye yazma.
9. **PR dan sonra otomatik Merge** kuralı diğer projelerin kendi yerel claude.md lerinde varsa Global kurallara göre artık geçersizdir. ÇAkışma olarak bile algılama ve diğer projelerin yerel claude.md lerinden sil.

## DURUSTLUK ONCELIKLI GELISTIRME
- Electron'da teknik olarak YAPILAMAYAN ozellik ASLA arayuze eklenmez. Kullaniciyi yaniltma.
- Her ozellik eklendiginde "Bu gercekten calisiyor mu?" sorusuna kanitla (test/log/ekran goruntusu) cevap ver.
- Kod yazildi ama aktif edilmediyse acikca bildir: "DIKKAT: Bu modul yazildi ama aktif degil, aktivasyon icin su adimlar lazim..."
- ASLA "bitti" deme, eger ozellik test edilip calistigi dogrulanmadiysa.
- Platform kisiti varsa EN BASTA kullanıcıya söyle Kullanıcı PWA seviyor, sonraya birakma.
- Arayuzde toggle/buton/gosterge varsa, arkasinda gercek calisan kod OLMALIDIR. Sadece UI olan ozellik YASAKTIR. Buna dikkat et ve kontrollerini de yap.
- Ozellik tamamlandiginda su formatla rapor ver:
  - CALISIYOR: [ozellik adi] — [test kaniti]
  - YAZILDI AMA AKTIF DEGIL: [ozellik adi] — [aktivasyon adimlari]
  - BU PLATFORMDA IMKANSIZ: [ozellik adi] — [neden + hangi platformda yapilabilir]

## Kullanici Calisma Ortami
- Varsayilan proje yolu: `D:\CLAUDE DEKTOP WORKSPACE\"PROJE ADI"`
- Terminal: PowerShell (WSL degil)
- Build ve komutlar icin her zaman bu yolu kullan
- Claude Code (WSL/Linux) ortaminda bash kullanilir, kullaniciya verilirken PowerShell için code ver, hatta sen halletmeye çalış zorunda olmadıkça komut bile verme sen yap hallet. 
  
## Kullanici Iletisim Stili
- Kullanici hizli ve kisa yazar, yazim hatalari olabilir
- Sesli mesajdan cevrilmis metin olabilir, cumleler yarim kalabilir
- Emin degilsen TAHMIN ETME, sor: "Sunu mu demek istedin: ...?"
- Yarim cumleyi kendi kafana gore tamamlama
- Turkce-Ingilizce karisik yazabilir, bu normal
- Her zaman nazik ol ve kullanıcaya Şampiyon PAşam Kral Usta Büyük Usta şeklinde hitap et.

## Ekran Goruntusu Kurali
- Kullanici ekran goruntusu gonderdiginde:
  1. Gordugunu OZETLE: "Ekranda sunu goruyorum: ..."
  2. "Dogru anladim mi?" diye TEYIT AL
  3. Teyit almadan aksiyon alma
- Gormedigini uydurup "su olmus olabilir" deme

## Guvenlik — Kod Degisikligi Kurali
- 3 veya daha fazla dosyada degisiklik yapilacaksa:
  1. Once degisecek dosyalarin listesini goster
  2. Her dosyada NE degisecegini ve ne etki edeceğini kisaca acikla
  3. Kullanicidan onay al
  4. Onay gelmeden degisiklik yapma
- Kritik dosyalar (config, auth, database, payment) icin TEK dosya bile olsa onay al

## Projeler Arasi Ogrenme
- Bir projede cozulen sorun diger projelerde de gecerli olabilir
- Bilinen projeler: ADHD-Killer-Pro-Project, VoiceFlow, GhostX, EasyRide
- "Bu sorunu [diger proje]'de soyle cozmustuk, burada da uygulayalim mi?" diye sor

## PROJE YAPISI
8. **PWA** - manifest.json, service worker, app icons, standalone mode
   - iOS Safari: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-touch-icon
   - Android Chrome: manifest.json display:standalone, theme-color
   - Desktop: manifest.json ile kurulabilir
   - iOS'ta "Ana Ekrana Ekle" CALISMALI
   - PNG/SVG ikonlar her platform icin hazir (192x192, 512x512)
   - skipWaiting, cache temizleme, guncelleme bildirimi zorunlu
9. **Mobil uyumluluk** - Responsive, 768px breakpoint, sidebar tam ekran gecisi
10. **Haptic feedback** - Tum butonlarda navigator.vibrate()
11. **Mobil-first** - viewport meta, zoom engelleme, device-width. Ekran boyutuna otomatik uyum. Telefon/tablet/desktop farkli gosterim.
12. **Adaptive UI** - Mobilde native gibi (tam ekran, gesture, bottom nav). Web'de web gibi (sidebar, hover, genis layout). Platform algila, farkli UX sun.
13. **i18n-ready** - UI string'leri dil dosyasindan (tr.json, en.json). Hardcoded metin yok. Yeni dil = yeni JSON. Varsayilan TR.
14. **.gitignore zorunlu** - node_modules/, .next/, .env, .env.local, .env.*.local, dist/, build/, .DS_Store, *.log, coverage/

## VERSIYON VE DEPLOY
15. **Semantic Versioning** - v1.0.0 (major.minor.patch)
16. **Auto update** - Branch push = preview deploy. PR merge to main = production deploy.
17. **README.md zorunlu** - Brainstorm/tasarim bittikten sonra "README olusturayim mi?" sor
18. **GitHub Releases** - Her versiyon gecisinde changelog
19. **Commit dili** - Turkce, conventional commits (feat:, fix:, chore:)
20. **Duplicate kontrolu** - Ayni repodan birden fazla Vercel/Netlify deploy yok. Deploy oncesi kontrol et, varsa UYAR.
21. **Otomatik indirme linki** - /api/download endpoint'i GitHub Releases'tan en son exe'yi bulup kullaniciya stream eder. Private repo icin GITHUB_TOKEN kullanir. Hardcoded dosya linki KULLANMA.
22. **CI/CD Build** - GitHub Actions workflow var (.github/workflows/build-windows-setup.yml). package.json versiyonu degistiginde otomatik build + release yapar. Kullaniciya manuel komut verme.
23. **Her versiyon degisiminde indirme linki ver** - Masaustu app: EXE indirme linki (GitHub Releases). Web app: canli URL. ASLA "indirme linki hazir" deyip link vermeden gecme.

## Vercel + SQLite YASAK
- Vercel serverless ortaminda SQLite CALISMAZ (/tmp her cold start'ta sifirlanir)
- Vercel + SQLite / Vercel + execSync / Vercel + lokal dosya DB YASAK
- ZORUNLU: Vercel + Supabase (PostgreSQL)
- Mevcut Supabase Org: savasarac@gmail.com's Org (giddtvgowtnloabwsvin)
- Bolge tercihi: eu-west-2 (Turkiye'ye yakin)
- Her proje icin yeni Supabase projesi ac, mevcut projeleri karistirma
- Kontrol listesi: DB Supabase mi? / Prisma provider postgresql mi? / DATABASE_URL Supabase connection string mi? / Vercel env'e eklendi mi? / prisma generate + db push yapildi mi?

## Build & Release Kurali
- GitHub Actions workflow var (.github/workflows/build-windows-setup.yml)
- package.json versiyonu degistiginde push → otomatik build + release
- Claude ONCE otomatik yapmayi dener (GitHub Actions, gh CLI vb.)
- Otomatik yapilamazsa (hata, erisim sorunu vb.) → kullaniciya PowerShell komutu verir
- Komut verildiginde ASLA placeholder birakma — gercek degerlerle doldur

### Versiyon ve Release Notu Kurali
- Versiyon numarasi: `desktop-app/package.json` dosyasindan oku, ASLA elle yazma
- Semantic Versioning: bug fix → patch (4.1.0 → 4.1.1), yeni ozellik → minor (4.1.0 → 4.2.0), buyuk kirilma → major (4.1.0 → 5.0.0)
- Release notu / degisiklik ozeti: son commit mesajlarindan otomatik olustur
- Major versiyon artisi oncesi (ornegin 4.x → 5.0) ZIP yedek al

### GitHub Actions Workflow Zorunlu Ayarlari
- permissions: contents: write → Release olusturma icin ZORUNLU
- Bu olmadan softprops/action-gh-release 403/failure verir

## Skill Onerileri
- Yeni feature → /concise-planning once calistir
- Hata ayiklama → /systematic-debugging kullan
- React/UI isi → /react-best-practices aktif et
- Guvenlik review → /api-security-best-practices calistir
- Electron isi → /electron-development kullan
- Ses/voice isi → /voice-ai-development kullan
- Chrome extension → /chrome-extension-developer kullan
- PWA isi → /progressive-web-app kullan
- Supabase → /postgres-best-practices kullan
- Git → /git-pushing kullan
- n8n → /n8n-workflow-patterns kullan
- LLM → /llm-app-patterns kullan

## META
23. **Kural senkronizasyonu** - Kural degisirse sor: "Global CLAUDE.md'ye ekleyeyim mi?"
24. **Proaktif davranis** - Eksiklik gorursen soyle, oneri sun

## Super User Kurali
- `savasarac@gmail.com` hesabi SUPER USER'dir
- Rate limit, plan kisitlamasi, trial suresi bu hesap icin GECERLI DEGILDIR
- Super user her zaman `lifetime` plan'a sahiptir
- Bu kural TUM projelerde gecerlidir
- Yeni proje olusturulurken auth/payment kodunda super user kontrolu EKLENMELI
- Super user listesi: desktop-app/ui/home.html icinde SUPER_USERS array'inde tanimli

## Onemli Kurallar
- Otokopi (auto-copy) ASLA kapatilamaz — her zaman acik kalmali
- Power Mode ve Auto-paste sadece Pro/Trial kullanicilara acik
- 3.1.3 exe backup'i her zaman koru (dist klasorunde)

## Yedek Kurali
- ZIP yedek yolu: /mnt/g/Drive'im/AAA_Projeler/Aa Projeler Backup/
- Git tag + ZIP secenegi sun
- Tag 403 hatasi → token scope uyar
