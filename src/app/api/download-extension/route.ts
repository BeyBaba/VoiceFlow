import { NextResponse } from "next/server";

// GET /api/download-extension → Chrome Extension ZIP indir (GitHub repo'dan)
export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  try {
    // GitHub API'den chrome-extension klasorundeki dosyalari al
    const res = await fetch(
      "https://api.github.com/repos/BeyBaba/VoiceFlow/contents/chrome-extension",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return new NextResponse("Chrome Extension bulunamadi.", { status: 404 });
    }

    // ZIP olarak repo'nun chrome-extension klasorunu indir
    const zipRes = await fetch(
      "https://api.github.com/repos/BeyBaba/VoiceFlow/zipball/master",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        redirect: "follow",
      }
    );

    if (!zipRes.ok) {
      return new NextResponse("Indirme hatasi.", { status: 500 });
    }

    return new NextResponse(zipRes.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="VoiceFlow-ChromeExtension.zip"',
      },
    });
  } catch {
    return new NextResponse("Bir hata olustu.", { status: 500 });
  }
}
