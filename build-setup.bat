@echo off
chcp 65001 >nul
title VoiceFlow 4.0.1 Setup Builder
echo ============================================
echo    VoiceFlow 4.0.1 - Setup Olusturucu
echo ============================================
echo.

cd /d "%~dp0"

if not exist "desktop-app\package.json" (
    echo HATA: desktop-app klasoru bulunamadi!
    echo Bu dosyayi VoiceFlow ana klasorune koyun.
    pause
    exit /b 1
)

cd desktop-app

echo [1/3] Bagimliklar yukleniyor...
call npm install
if errorlevel 1 (
    echo HATA: npm install basarisiz!
    pause
    exit /b 1
)

echo.
echo [2/3] Setup dosyasi olusturuluyor...
call npm run build
if errorlevel 1 (
    echo HATA: Build basarisiz!
    pause
    exit /b 1
)

echo.
echo ============================================
echo    BASARILI! Setup dosyasi olusturuldu:
echo    desktop-app\dist\VoiceFlow Setup 4.0.1.exe
echo ============================================
echo.

if exist "dist\VoiceFlow Setup 4.0.1.exe" (
    echo Setup dosyasini acmak icin bir tusa basin...
    pause >nul
    explorer "dist"
)

pause
