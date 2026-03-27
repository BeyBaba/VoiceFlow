# VoiceFlow - Claude Code Kurallari

## Kullanici Calisma Ortami
- Varsayilan proje yolu: `D:\CLAUDE DEKTOP WORKSPACE\VoiceFlow`
- Terminal: PowerShell (WSL degil)
- Build ve komutlar icin her zaman bu yolu kullan

## Release Kurali
Her yeni degisiklik veya versiyon guncellemesinde:
1. `desktop-app/package.json` versiyonunu guncelle
2. `npm run build` ile Windows exe olustur
3. GitHub Release olustur ve setup exe dosyasini yukle
4. Kullaniciya indirilebilir link ver
5. Bu kural her session'da gecerlidir
