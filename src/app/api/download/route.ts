import { NextResponse } from "next/server";

// GET /api/download → Private GitHub repo'dan en son exe'yi indir
// GITHUB_TOKEN env variable gerekli (private repo erişimi için)
export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  try {
    // GitHub API'den latest release'i al
    const res = await fetch(
      "https://api.github.com/repos/BeyBaba/VoiceFlow/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 300 }, // 5 dakika cache
      }
    );

    if (!res.ok) {
      return new NextResponse(
        downloadPage("Indirme linki alinamadi. Lutfen daha sonra tekrar deneyin."),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const release = await res.json();

    // .exe uzantili asset'i bul
    const exeAsset = release.assets?.find(
      (a: { name: string }) => a.name.endsWith(".exe")
    );

    if (!exeAsset) {
      return new NextResponse(
        downloadPage("Exe dosyasi bulunamadi. Lutfen daha sonra tekrar deneyin."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Private repo: asset URL'e token ile eriş
    const assetUrl = exeAsset.url; // API URL (not browser_download_url)
    const downloadRes = await fetch(assetUrl, {
      headers: {
        Accept: "application/octet-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "follow",
    });

    if (!downloadRes.ok) {
      return new NextResponse(
        downloadPage("Dosya indirilemedi. Lutfen daha sonra tekrar deneyin."),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Dosyayı kullanıcıya stream et
    return new NextResponse(downloadRes.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${exeAsset.name}"`,
        "Content-Length": exeAsset.size?.toString() || "",
      },
    });
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
