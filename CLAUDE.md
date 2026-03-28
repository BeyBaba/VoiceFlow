# VoiceFlow - Claude Code Kurallari

## Kullanici Calisma Ortami
- Varsayilan proje yolu: `D:\CLAUDE DEKTOP WORKSPACE\VoiceFlow`
- Terminal: PowerShell (WSL degil)
- Build ve komutlar icin her zaman bu yolu kullan

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

## Onemli Kurallar
- Master'a ASLA sormadan merge yapma
- 3.1.3 exe backup'i her zaman koru (dist klasorunde)
- Otokopi (auto-copy) ASLA kapatilamaz — her zaman acik kalmali
- Power Mode ve Auto-paste sadece Pro/Trial kullanicilara acik
