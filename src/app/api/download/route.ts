import { NextRequest, NextResponse } from "next/server";

// Versiyon: desktop-app/package.json ile senkron tutulmalı
const CURRENT_VERSION = "4.3.5";

// Vercel serverless function timeout — 60 saniye (Pro plan'da 300sn)
export const maxDuration = 60;

// GET /api/download → Private GitHub repo'dan en son exe'yi indir
export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return new NextResponse(
      downloadPage("GITHUB_TOKEN ayarlanmamis. Vercel dashboard'dan ekleyin."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    // GitHub API'den latest release'i al
    const res = await fetch(
      "https://api.github.com/repos/BeyBaba/VoiceFlow/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return new NextResponse(
        downloadPage(`GitHub API hatasi: ${res.status}. Token gecersiz olabilir.`),
        { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const release = await res.json();

    // .exe uzantılı asset'i bul (blockmap hariç)
    const exeAsset = release.assets?.find(
      (a: { name: string }) =>
        a.name.endsWith(".exe") && !a.name.endsWith(".blockmap")
    );

    if (!exeAsset) {
      return new NextResponse(
        downloadPage("Release'de exe dosyasi bulunamadi."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Yöntem 1: GitHub API'den redirect URL al
    try {
      const assetRes = await fetch(exeAsset.url, {
        headers: {
          Accept: "application/octet-stream",
          Authorization: `Bearer ${token}`,
        },
        redirect: "manual",
      });

      const directUrl = assetRes.headers.get("location") || assetRes.headers.get("Location");
      if (directUrl) {
        // GitHub CDN'e doğrudan yönlendir — token gerektirmeyen geçici URL
        return NextResponse.redirect(directUrl, 302);
      }
    } catch {
      // Redirect alamazsak proxy yöntemine düş
    }

    // Yöntem 2: Proxy — dosyayı stream et (fallback)
    const downloadRes = await fetch(exeAsset.url, {
      headers: {
        Accept: "application/octet-stream",
        Authorization: `Bearer ${token}`,
      },
      redirect: "follow",
    });

    if (!downloadRes.ok) {
      return new NextResponse(
        downloadPage(`Dosya indirme hatasi: ${downloadRes.status}`),
        { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const releaseVersion = release.tag_name?.replace(/^v/, "") || CURRENT_VERSION;
    const filename = `VoiceFlow-Setup-${releaseVersion}.exe`;

    return new NextResponse(downloadRes.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": exeAsset.size?.toString() || "",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return new NextResponse(
      downloadPage(`Hata: ${message}`),
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
