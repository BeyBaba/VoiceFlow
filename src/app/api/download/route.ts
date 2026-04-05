import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Versiyon: desktop-app/package.json ile senkron tutulmalı
const CURRENT_VERSION = "4.2.5";

// GET /api/download → Private GitHub repo'dan en son exe'yi indir
// GITHUB_TOKEN env variable gerekli (private repo erişimi için)
// Fallback: public/downloads/VoiceFlow-Setup.exe dosyasını sunar
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

        // .exe uzantili asset'i bul
        const exeAsset = release.assets?.find(
          (a: { name: string }) => a.name.endsWith(".exe")
        );

        if (exeAsset) {
          // Private repo: asset URL'e token ile eriş
          const assetUrl = exeAsset.url;
          const downloadRes = await fetch(assetUrl, {
            headers: {
              Accept: "application/octet-stream",
              Authorization: `Bearer ${token}`,
            },
            redirect: "follow",
          });

          if (downloadRes.ok) {
            // Release tag'inden versiyon al (v4.2.2 -> 4.2.2)
            const releaseVersion = release.tag_name?.replace(/^v/, "") || CURRENT_VERSION;
            const filename = `VoiceFlow-Setup-${releaseVersion}.exe`;
            return new NextResponse(downloadRes.body, {
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": exeAsset.size?.toString() || "",
              },
            });
          }
        }
      }
    }

    // Fallback: local dosyadan sun (versiyonlu isimle)
    const localPath = path.join(process.cwd(), "public", "downloads", "VoiceFlow-Setup.exe");
    const filename = `VoiceFlow-Setup-${CURRENT_VERSION}.exe`;
    try {
      const fileBuffer = await readFile(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    } catch {
      // Local dosya da yoksa hata sayfası göster
      return new NextResponse(
        downloadPage("Indirme dosyasi bulunamadi. Lutfen daha sonra tekrar deneyin."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
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
