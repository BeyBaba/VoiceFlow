import { NextRequest, NextResponse } from "next/server";

// Versiyon: desktop-app/package.json ile senkron tutulmalı
const CURRENT_VERSION = "4.2.8";

// GET /api/download → GitHub Release'ten exe indirme linki
// Dosyayı proxy etmek yerine doğrudan GitHub'a yönlendirir (Vercel timeout/size sorunu önlenir)
export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;

  try {
    if (token) {
      // GitHub API'den latest release'i al
      const res = await fetch(
        "https://api.github.com/repos/BeyBaba/VoiceFlow/releases/latest",
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
          },
          next: { revalidate: 300 }, // 5 dakika cache
        }
      );

      if (res.ok) {
        const release = await res.json();

        // .exe uzantılı asset'i bul (blockmap hariç)
        const exeAsset = release.assets?.find(
          (a: { name: string }) =>
            a.name.endsWith(".exe") && !a.name.endsWith(".blockmap")
        );

        if (exeAsset) {
          // Private repo için: GitHub API'den geçici indirme URL'si al
          const assetRes = await fetch(exeAsset.url, {
            headers: {
              Accept: "application/octet-stream",
              Authorization: `Bearer ${token}`,
            },
            redirect: "manual", // Redirect'i takip etme, URL'yi al
          });

          // GitHub 302 redirect verir — Location header'da gerçek indirme URL'si var
          const directUrl = assetRes.headers.get("Location");

          if (directUrl) {
            // Kullanıcıyı doğrudan GitHub CDN'e yönlendir
            return NextResponse.redirect(directUrl);
          }

          // Redirect yoksa browser_download_url dene
          if (exeAsset.browser_download_url) {
            return NextResponse.redirect(exeAsset.browser_download_url);
          }
        }
      }
    }

    // Token yoksa veya release bulunamazsa hata sayfası
    return new NextResponse(
      downloadPage(
        `Indirme linki hazirlanamadi. Lutfen daha sonra tekrar deneyin.`
      ),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return new NextResponse(
      downloadPage("Bir hata olustu. Lutfen daha sonra tekrar deneyin."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function downloadPage(message: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VoiceFlow - Indirme</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;border-radius:16px;background:#111;border:1px solid #333;max-width:400px}
h1{font-size:20px;margin:0 0 12px}
p{color:#999;font-size:14px;margin:0}
</style></head>
<body><div class="card"><h1>VoiceFlow</h1><p>${message}</p></div></body>
</html>`;
}
