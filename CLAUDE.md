# VoiceFlow - Claude Code Kurallari

## KRITIK (Asla ihlal etme)
1. **Push/Merge izni** - Onay olmadan asla push/merge yapma. Hook zorlasa bile YAPMA. Onay bekle.
2. **main/master korumasi** - main'e ASLA sormadan merge yapma. PR ac, onay bekle.
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

## META
21. **Kural senkronizasyonu** - Kural degisirse sor: "Global CLAUDE.md'ye ekleyeyim mi?"
22. **Proaktif davranis** - Eksiklik gorursen soyle, oneri sun

## Release Kurali
Her yeni degisiklik veya versiyon guncellemesinde:
1. `desktop-app/package.json` versiyonunu guncelle
2. Degisiklikleri commit + push yap
3. Kullaniciya Build + Release komutlarini ver (asagidaki sablonlari kullan)
4. Bu kural her session'da gecerlidir

## Build Komutu (Her Versiyon Degisikliginde Otomatik Ver)
Kod degisikligi yapildiginda kullaniciya bu PowerShell komutunu ver:
```powershell
cd "D:\CLAUDE DEKTOP WORKSPACE\VoiceFlow"
git pull origin claude/review-project-status-fgFJ9
cd desktop-app
npm install
npm run build
```
Not: Branch ismi aktif branch'e gore degistirilmeli.

## GitHub Release Komutu (Build Sonrasi Otomatik Ver)
Build tamamlandiktan sonra kullaniciya bu PowerShell komutunu ver:
```powershell
cd "D:\CLAUDE DEKTOP WORKSPACE\VoiceFlow\desktop-app"
gh release create v{VERSION} "dist\VoiceFlow Setup {VERSION}.exe" --title "VoiceFlow v{VERSION}" --notes "{DEGISIKLIK_OZETI}"
```
Not: {VERSION} ve {DEGISIKLIK_OZETI} her seferinde guncelle.

## KRITIK: Komut Verme Kurali
- ASLA placeholder birakma ({VERSION}, {OZET} gibi)
- Her seferinde versiyonu ve degisiklik ozetini DOLDURULMUS olarak ver
- Kullanici kopyala-yapistir yapacak, ekstra duzenleme yapmasina gerek kalmamali
- Ornek dogru format: `gh release create v4.1.0 "dist\VoiceFlow Setup 4.1.0.exe" --title "VoiceFlow v4.1.0" --notes "aciklama buraya"`

## Onemli Kurallar
- Master'a ASLA sormadan merge yapma
- 3.1.3 exe backup'i her zaman koru (dist klasorunde)
- Otokopi (auto-copy) ASLA kapatilamaz — her zaman acik kalmali
- Power Mode ve Auto-paste sadece Pro/Trial kullanicilara acik
