// GhostX Room API
// Oda olusturma ve silme
// TUM VERILER PROCESS MEMORY'DE - VERITABANINA YAZILMAZ

import { NextRequest, NextResponse } from 'next/server';

interface RoomEntry {
  id: string;
  inviteCode: string;
  createdAt: number;
  ttl: number;
  peerCount: number;
}

// In-memory oda kaydi
const rooms = new Map<string, RoomEntry>();

// 0/O ve 1/I karisikligi olmayan karakter seti
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length: number = 6): string {
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += CHARSET[array[i] % CHARSET.length];
  }
  return code;
}

// Suresi dolmus odalari temizle
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, room] of rooms) {
      if (now - room.createdAt > room.ttl) {
        rooms.delete(id);
      }
    }
  }, 60_000);
}

// === POST: Oda olustur ===
export async function POST() {
  const code = generateCode();
  const room: RoomEntry = {
    id: code,
    inviteCode: code,
    createdAt: Date.now(),
    ttl: 24 * 60 * 60 * 1000, // 24 saat
    peerCount: 0,
  };

  rooms.set(code, room);

  return NextResponse.json({
    roomId: code,
    inviteCode: code,
    expiresAt: room.createdAt + room.ttl,
  });
}

// === DELETE: Oda sil ===
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json(
      { error: 'roomId gerekli' },
      { status: 400 }
    );
  }

  rooms.delete(roomId);
  return NextResponse.json({ ok: true });
}

// === GET: Oda bilgisi (varlik kontrolu) ===
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json(
      { error: 'roomId gerekli' },
      { status: 400 }
    );
  }

  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json(
      { error: 'Oda bulunamadi veya suresi doldu' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    roomId: room.id,
    exists: true,
    peerCount: room.peerCount,
    expiresAt: room.createdAt + room.ttl,
  });
}
