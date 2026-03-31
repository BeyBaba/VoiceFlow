# VoiceFlow - Claude Code Kurallari

## KRITIK (Asla ihlal etme)
1. **Otomatik PR + Merge** - Claude otomatik PR olusturur ve merge eder. Kullaniciya "merge edeyim mi?" diye SORMA — direkt yap. Sadece sonucu bildir: "PR #X olusturuldu ve merge edildi"
2. **main/master korumasi** - main'e direkt push YASAK. Her zaman claude/ branch → PR → merge akisi
3. **PR zorunlulugu** - main'e direkt push yok, PR uzerinden merge
4. **Test sonrasi push** - Syntax/bracket kontrolu yapilmadan push yapma
5. **Gizli dosya korumasi** - .env, credentials, API key ASLA commit edilmez
6. **Placeholder yasak** - Kullaniciya verilen komutlarda ASLA placeholder birakma ({VERSION}, {OZET} gibi). Her seferinde gercek degerleri DOLDURULMUS olarak ver. Kullanici kopyala-yapistir yapacak, ekstra duzenleme yapmasina gerek kalmamali.
7. **Windows PowerShell zorunlu** - ASLA Ubuntu/Linux/bash komutu verme. Her zaman Windows PowerShell formati kullan. Ornek: `rm -rf` degil `Remove-Item -Recurse`

## Kullanici Calisma Ortami
- Varsayilan proje yolu: `D:\CLAUDE DEKTOP WORKSPACE\VoiceFlow`
- Terminal: PowerShell (WSL degil)
- Build ve komutlar icin her zaman bu yolu kullan

## PROJE YAPISI
8. **PWA** - manifest.json, service worker, app icons, standalone mode
9. **Mobil uyumluluk** - Responsive, 768px breakpoint, sidebar tam ekran gecisi
10. **Haptic feedback** - Tum butonlarda navigator.vibrate()
11. **Mobil-first** - viewport meta, zoom engelleme, device-width. Ekran boyutuna otomatik uyum. Telefon/tablet/desktop farkli gosterim.
12. **Adaptive UI** - Mobilde native gibi (tam ekran, gesture, bottom nav). Web'de web gibi (sidebar, hover, genis layout). Platform algila, farkli UX sun.
13. **i18n-ready** - UI string'leri dil dosyasindan (tr.json, en.json). Hardcoded metin yok. Yeni dil = yeni JSON
14. **.gitignore zorunlu** - node_modules/, .next/, .env, dist/, build/, .DS_Store

## VERSIYON VE DEPLOY
15. **Semantic Versioning** - v1.0.0 (major.minor.patch)
16. **Auto update** - Branch push = preview deploy. PR merge to main = production deploy.
17. **README.md zorunlu** - Brainstorm/tasarim bittikten sonra "README olusturayim mi?" sor
18. **GitHub Releases** - Her versiyon gecisinde changelog
19. **Commit dili** - Turkce, conventional commits (feat:, fix:, chore:)
20. **Duplicate kontrolu** - Ayni repodan birden fazla deploy yok
21. **Otomatik indirme linki** - /api/download endpoint'i GitHub Releases'tan en son exe'yi bulup kullaniciya stream eder. Private repo icin GITHUB_TOKEN kullanir. Hardcoded dosya linki KULLANMA.
22. **CI/CD Build** - GitHub Actions workflow var (.github/workflows/build-windows-setup.yml). package.json versiyonu degistiginde otomatik build + release yapar. Kullaniciya manuel komut verme.

## META
23. **Kural senkronizasyonu** - Kural degisirse sor: "Global CLAUDE.md'ye ekleyeyim mi?"
24. **Proaktif davranis** - Eksiklik gorursen soyle, oneri sun

## Build & Release Kurali
- GitHub Actions workflow var (.github/workflows/build-windows-setup.yml)
- package.json versiyonu degistiginde push → otomatik build + release
- Claude ONCE otomatik yapmayi dener (GitHub Actions, gh CLI vb.)
- Otomatik yapilamazsa (hata, erisim sorunu vb.) → kullaniciya PowerShell komutu verir
- Komut verildiginde ASLA placeholder birakma — gercek degerlerle doldur
- Kullanici kopyala-yapistir yapacak, ekstra duzenleme yapmasina gerek kalmamali

### Versiyon ve Release Notu Kurali
- Versiyon numarasi: `desktop-app/package.json` dosyasindan oku, ASLA elle yazma
- Release notu / degisiklik ozeti: son commit mesajlarindan otomatik olustur
- Kullaniciya komut verilecekse bu iki degeri onceden oku ve doldurulmus ver

## Onemli Kurallar
- Master'a ASLA sormadan merge yapma
- 3.1.3 exe backup'i her zaman koru (dist klasorunde)
- Otokopi (auto-copy) ASLA kapatilamaz — her zaman acik kalmali
- Power Mode ve Auto-paste sadece Pro/Trial kullanicilara acik
