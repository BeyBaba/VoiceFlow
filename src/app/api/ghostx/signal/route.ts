// GhostX Signaling Server
// SADECE WebRTC baglanti kurma sinyallerini iletir
// MESAJ ICERIGI ASLA BURADAN GECMEZ
// Tum veriler process memory'de tutulur, veritabanina YAZILMAZ

import { NextRequest, NextResponse } from 'next/server';

// === In-Memory Signal Store ===
// Her oda icin sinyal kuyrugu (process memory, disk degil)

interface SignalEntry {
  peerId: string;
  peerName: string;
  type: string;
  payload: string;
  timestamp: number;
}

interface RoomSignals {
  signals: SignalEntry[];
  createdAt: number;
  ttl: number; // ms
}

const roomSignals = new Map<string, RoomSignals>();

// Rate limiting: peer basina saniyede max sinyal
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_SIGNALS_PER_SECOND = 10;

// Suresi dolmus odalari temizle (her 60 saniyede)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of roomSignals) {
      if (now - room.createdAt > room.ttl) {
        roomSignals.delete(roomId);
      }
    }
    // Eski rate limit kayitlarini temizle
    for (const [key, limit] of rateLimits) {
      if (now > limit.resetAt) {
        rateLimits.delete(key);
      }
    }
  }, 60_000);
}

function checkRateLimit(peerId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(peerId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(peerId, { count: 1, resetAt: now + 1000 });
    return true;
  }

  if (limit.count >= MAX_SIGNALS_PER_SECOND) {
    return false;
  }

  limit.count++;
  return true;
}

// === POST: Sinyal gonder ===
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, peerId, peerName, type, payload } = body;

    if (!roomId || !peerId || !type || !payload) {
      return NextResponse.json(
        { error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    // Rate limit kontrolu
    if (!checkRateLimit(peerId)) {
      return NextResponse.json(
        { error: 'Cok fazla sinyal, yavasla' },
        { status: 429 }
      );
    }

    // Oda yoksa olustur
    if (!roomSignals.has(roomId)) {
      roomSignals.set(roomId, {
        signals: [],
        createdAt: Date.now(),
        ttl: 24 * 60 * 60 * 1000, // 24 saat
      });
    }

    const room = roomSignals.get(roomId)!;

    // Sinyali ekle
    room.signals.push({
      peerId,
      peerName: peerName || 'Ghost',
      type,
      payload,
      timestamp: Date.now(),
    });

    // Eski sinyalleri temizle (son 100 tane tut)
    if (room.signals.length > 100) {
      room.signals = room.signals.slice(-100);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Sinyal isleme hatasi' },
      { status: 500 }
    );
  }
}

// === GET: SSE ile sinyalleri dinle ===
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const peerId = searchParams.get('peerId');
  const since = parseInt(searchParams.get('since') || '0');

  if (!roomId || !peerId) {
    return NextResponse.json(
      { error: 'roomId ve peerId gerekli' },
      { status: 400 }
    );
  }

  // SSE (Server-Sent Events) stream
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Baglanti mesaji
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', roomId })}\n\n`)
      );

      // Her 500ms'de yeni sinyalleri kontrol et
      let lastTimestamp = since || Date.now();

      const interval = setInterval(() => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        const room = roomSignals.get(roomId);
        if (!room) return;

        // Bizim olmayan ve son kontrol'den sonraki sinyaller
        const newSignals = room.signals.filter(
          s => s.peerId !== peerId && s.timestamp > lastTimestamp
        );

        for (const signal of newSignals) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(signal)}\n\n`)
            );
            lastTimestamp = signal.timestamp;
          } catch {
            // Stream kapanmis olabilir
            isClosed = true;
            clearInterval(interval);
          }
        }
      }, 500);

      // 5 dakikada bir keepalive
      const keepalive = setInterval(() => {
        if (isClosed) {
          clearInterval(keepalive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          isClosed = true;
          clearInterval(keepalive);
        }
      }, 30_000);

      // Temizlik
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
        clearInterval(keepalive);
        try { controller.close(); } catch { /* zaten kapanmis */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
