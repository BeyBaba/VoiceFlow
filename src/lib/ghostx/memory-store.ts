// GhostX Memory Store - RAM-Only Depo
// HICBIR SEY DISKE YAZILMAZ
// localStorage, IndexedDB, cookie, file system YASAK
// Uygulama kapandiginda tum veriler fiziksel olarak yok olur

import type { DecryptedMessage, Room, PeerInfo, DeliveryStatus } from './types';
import { secureWipe, secureWipeAll } from './crypto';

export class MemoryStore {
  private messages: Map<string, DecryptedMessage[]> = new Map();
  private rooms: Map<string, Room> = new Map();
  private isDestroyed = false;

  // === Mesaj Islemleri ===

  addMessage(roomId: string, message: DecryptedMessage): void {
    this.checkDestroyed();
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }
    this.messages.get(roomId)!.push(message);

    // Kaybolan mesaj zamanlayicisi
    if (message.disappearAfter && message.disappearAfter > 0) {
      message.disappearAt = Date.now() + message.disappearAfter;
      setTimeout(() => {
        this.removeMessage(roomId, message.id);
      }, message.disappearAfter);
    }
  }

  getMessages(roomId: string): DecryptedMessage[] {
    this.checkDestroyed();
    return this.messages.get(roomId) || [];
  }

  removeMessage(roomId: string, messageId: string): boolean {
    const messages = this.messages.get(roomId);
    if (!messages) return false;

    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    const msg = messages[index];
    // Medya verisini guvenli sil
    if (msg.mediaData) {
      secureWipe(msg.mediaData);
    }
    messages.splice(index, 1);
    return true;
  }

  updateMessageStatus(
    roomId: string,
    messageId: string,
    status: DeliveryStatus
  ): void {
    const messages = this.messages.get(roomId);
    if (!messages) return;
    const msg = messages.find(m => m.id === messageId);
    if (msg) msg.status = status;
  }

  // === Oda Islemleri ===

  addRoom(room: Room): void {
    this.checkDestroyed();
    this.rooms.set(room.id, room);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  removeRoom(roomId: string): void {
    // Once mesajlari sil
    this.wipeRoomMessages(roomId);
    this.rooms.delete(roomId);
  }

  addPeerToRoom(roomId: string, peer: PeerInfo): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.peers.set(peer.id, peer);
    }
  }

  removePeerFromRoom(roomId: string, peerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      const peer = room.peers.get(peerId);
      if (peer) {
        // Peer'in public key'ini sil
        secureWipe(peer.publicKey);
        room.peers.delete(peerId);
      }
    }
  }

  // === PANIK - HER SEYI SIL ===

  /**
   * TUM VERILERI ANINDA VE GERI DONDURULEMEZ SEKILDE SIL
   * Bu fonksiyon cagrildiginda:
   * 1. Tum mesajlardaki medya verileri sodium.memzero ile sifirlanir
   * 2. Tum peer public key'leri sifirlanir
   * 3. Tum Map'ler temizlenir
   * 4. Store kullanilmaz hale gelir
   */
  panic(): void {
    // 1. Tum mesajlardaki buffer'lari sifirla
    for (const [, messages] of this.messages) {
      for (const msg of messages) {
        if (msg.mediaData) {
          secureWipe(msg.mediaData);
          msg.mediaData = undefined;
        }
        // String icerigini ust yaz
        msg.content = '';
        msg.senderName = '';
        msg.senderId = '';
      }
    }

    // 2. Tum peer key'lerini sifirla
    for (const [, room] of this.rooms) {
      for (const [, peer] of room.peers) {
        secureWipe(peer.publicKey);
      }
      room.peers.clear();
    }

    // 3. Map'leri temizle
    this.messages.clear();
    this.rooms.clear();

    // 4. Store'u devre disi birak
    this.isDestroyed = true;
  }

  // === Dahili Yardimci ===

  private wipeRoomMessages(roomId: string): void {
    const messages = this.messages.get(roomId);
    if (!messages) return;

    for (const msg of messages) {
      if (msg.mediaData) {
        secureWipe(msg.mediaData);
      }
    }
    this.messages.delete(roomId);
  }

  private checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('MemoryStore yok edildi (panic). Yeni store olusturun.');
    }
  }

  /** Store'un aktif olup olmadigini kontrol et */
  get isActive(): boolean {
    return !this.isDestroyed;
  }

  /** Toplam mesaj sayisi */
  get totalMessages(): number {
    let count = 0;
    for (const [, msgs] of this.messages) {
      count += msgs.length;
    }
    return count;
  }
}
