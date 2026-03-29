import { NextResponse } from "next/server";

// GET /api/download → GitHub Releases'tan en son exe'yi bulup yonlendir
export async function GET() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/BeyBaba/VoiceFlow/releases/latest",
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 }, // 5 dakika cache
      }
    );

    if (!res.ok) {
      return NextResponse.redirect(
        "https://github.com/BeyBaba/VoiceFlow/releases/latest"
      );
    }

    const release = await res.json();

    // .exe uzantili asset'i bul
    const exeAsset = release.assets?.find(
      (a: { name: string }) => a.name.endsWith(".exe")
    );

    if (exeAsset?.browser_download_url) {
      return NextResponse.redirect(exeAsset.browser_download_url);
    }

    // Exe bulunamazsa releases sayfasina yonlendir
    return NextResponse.redirect(
      "https://github.com/BeyBaba/VoiceFlow/releases/latest"
    );
  } catch {
    return NextResponse.redirect(
      "https://github.com/BeyBaba/VoiceFlow/releases/latest"
    );
  }
}
