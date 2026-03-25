// GhostX Mesh Network - Multi-Hop Mesaj Yonlendirme
// Internet olmayan peer'ler, yakinlarindaki peer'ler uzerinden mesaj gonderir
// Interneti olan tek kisi "gateway" olarak tum grubu internete baglar
//
// Topoloji ornegi:
//   [A] --BLE-- [B] --BLE-- [C] --WiFi-- [D] --INTERNET-- [Signaling]
//   A internete erisemez ama B ve C uzerinden D'ye ulasir
//   D internete bagli, A'nin mesajini signaling server'a iletir
//
// Routing: Flooding + TTL (basit ama etkili)
// Her mesaj benzersiz ID tasir, tekrar gonderimi onlenir (seen set)

import { encrypt, decrypt, randomBytes, generateMessageId } from './crypto';
import type { EncryptedPayload } from './types';

// === Mesh Paket Yapisi ===

export interface MeshPacket {
  id: string;              // Benzersiz paket ID (tekrar gonderimi onlemek icin)
  type: MeshPacketType;
  source: string;          // Gonderenin peer ID'si
  destination: string;     // Alicinin peer ID'si ('*' = broadcast)
  ttl: number;             // Time-to-live (kac hop daha iletilebilir)
  hopCount: number;        // Kac hop gecti
  hops: string[];          // Gecilen peer ID'leri
  payload: Uint8Array;     // Sifreli icerik
  timestamp: number;
}

export enum MeshPacketType {
  DATA = 'data',              // Normal mesaj
  DISCOVERY = 'discovery',    // Peer kesfetme
  ROUTE_REQUEST = 'rreq',     // Rota istegi
  ROUTE_REPLY = 'rrep',       // Rota yaniti
  ACK = 'ack',                // Iletim onayi
  GATEWAY_ANNOUNCE = 'gw',    // Gateway duyurusu (internete bagli peer)
}

// === Routing Tablosu ===

interface RouteEntry {
  destination: string;     // Hedef peer ID
  nextHop: string;         // Bir sonraki atlama peer ID
  hopCount: number;        // Toplam atlama sayisi
  lastSeen: number;        // Son gorulme zamani
  isGateway: boolean;      // Internet gateway mi?
}

// === Mesh Node ===

const MAX_TTL = 10;            // Maksimum atlama sayisi
const SEEN_CACHE_SIZE = 1000;  // Gorulmus paket ID cache boyutu
const ROUTE_EXPIRY = 5 * 60 * 1000;  // Rota gecerlilik suresi (5 dk)
const DISCOVERY_INTERVAL = 30 * 1000; // Kesfetme araligi (30 sn)
const GATEWAY_ANNOUNCE_INTERVAL = 15 * 1000; // Gateway duyuru araligi

export class MeshNode {
  private peerId: string;
  private routingTable: Map<string, RouteEntry> = new Map();
  private seenPackets: Set<string> = new Set();
  private seenQueue: string[] = []; // FIFO - eski ID'leri temizlemek icin
  private isGateway: boolean = false;
  private discoveryTimer: ReturnType<typeof setInterval> | null = null;
  private gatewayTimer: ReturnType<typeof setInterval> | null = null;

  // Callback'ler
  public onSendToNeighbor: ((neighborId: string, packet: MeshPacket) => void) | null = null;
  public onBroadcastLocal: ((packet: MeshPacket) => void) | null = null;
  public onMessageReceived: ((fromPeerId: string, data: Uint8Array) => void) | null = null;
  public onGatewayFound: ((gatewayPeerId: string, hopCount: number) => void) | null = null;

  constructor(peerId: string) {
    this.peerId = peerId;
  }

  // === Yasamdongusu ===

  /** Mesh node'u baslat */
  start(hasInternet: boolean): void {
    this.isGateway = hasInternet;

    // Periyodik peer kesfetme
    this.discoveryTimer = setInterval(() => {
      this.sendDiscovery();
    }, DISCOVERY_INTERVAL);

    // Ilk kesfetmeyi hemen yap
    this.sendDiscovery();

    // Gateway ise duyuru yap
    if (this.isGateway) {
      this.gatewayTimer = setInterval(() => {
        this.announceGateway();
      }, GATEWAY_ANNOUNCE_INTERVAL);
      this.announceGateway();
    }
  }

  /** Mesh node'u durdur */
  stop(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    if (this.gatewayTimer) {
      clearInterval(this.gatewayTimer);
      this.gatewayTimer = null;
    }
    this.routingTable.clear();
    this.seenPackets.clear();
    this.seenQueue = [];
  }

  /** Internet durumu degisti */
  setGateway(isGateway: boolean): void {
    this.isGateway = isGateway;

    if (isGateway && !this.gatewayTimer) {
      this.gatewayTimer = setInterval(() => {
        this.announceGateway();
      }, GATEWAY_ANNOUNCE_INTERVAL);
      this.announceGateway();
    } else if (!isGateway && this.gatewayTimer) {
      clearInterval(this.gatewayTimer);
      this.gatewayTimer = null;
    }
  }

  // === Mesaj Gonderme ===

  /** Hedef peer'e mesaj gonder (mesh uzerinden) */
  sendMessage(destinationPeerId: string, data: Uint8Array): void {
    const packet: MeshPacket = {
      id: generateMessageId(),
      type: MeshPacketType.DATA,
      source: this.peerId,
      destination: destinationPeerId,
      ttl: MAX_TTL,
      hopCount: 0,
      hops: [this.peerId],
      payload: data,
      timestamp: Date.now(),
    };

    this.routePacket(packet);
  }

  /** Tum peer'lere broadcast gonder */
  broadcast(data: Uint8Array): void {
    const packet: MeshPacket = {
      id: generateMessageId(),
      type: MeshPacketType.DATA,
      source: this.peerId,
      destination: '*',
      ttl: MAX_TTL,
      hopCount: 0,
      hops: [this.peerId],
      payload: data,
      timestamp: Date.now(),
    };

    this.markSeen(packet.id);
    this.floodPacket(packet);
  }

  /** Internet'e mesaj gonder (gateway uzerinden) */
  sendViaGateway(data: Uint8Array): boolean {
    const gateway = this.findNearestGateway();
    if (!gateway) return false;

    this.sendMessage(gateway.destination, data);
    return true;
  }

  // === Mesaj Alma ===

  /** Komsu peer'den paket alindi */
  receivePacket(fromNeighborId: string, packet: MeshPacket): void {
    // Tekrar gonderimi onle
    if (this.hasSeen(packet.id)) return;
    this.markSeen(packet.id);

    // TTL kontrol
    if (packet.ttl <= 0) return;

    // Rota tablosunu guncelle (gelen yoldan ters rota)
    this.updateRoute(packet.source, fromNeighborId, packet.hopCount);

    // Paket tipine gore isle
    switch (packet.type) {
      case MeshPacketType.DATA:
        this.handleDataPacket(packet);
        break;
      case MeshPacketType.DISCOVERY:
        this.handleDiscovery(fromNeighborId, packet);
        break;
      case MeshPacketType.GATEWAY_ANNOUNCE:
        this.handleGatewayAnnounce(fromNeighborId, packet);
        break;
      case MeshPacketType.ROUTE_REQUEST:
        this.handleRouteRequest(fromNeighborId, packet);
        break;
      case MeshPacketType.ROUTE_REPLY:
        this.handleRouteReply(packet);
        break;
    }
  }

  // === Paket Isleme ===

  private handleDataPacket(packet: MeshPacket): void {
    if (packet.destination === this.peerId || packet.destination === '*') {
      // Bu paket bize (veya herkese)
      if (this.onMessageReceived) {
        this.onMessageReceived(packet.source, packet.payload);
      }

      // Broadcast ise iletmeye devam et
      if (packet.destination === '*') {
        this.forwardPacket(packet);
      }
    } else {
      // Bize degil, ilet
      this.forwardPacket(packet);
    }
  }

  private handleDiscovery(fromNeighborId: string, packet: MeshPacket): void {
    // Komsunun varligini rota tablosuna ekle
    this.updateRoute(packet.source, fromNeighborId, packet.hopCount);

    // Discovery'yi ilet (flood)
    this.forwardPacket(packet);
  }

  private handleGatewayAnnounce(fromNeighborId: string, packet: MeshPacket): void {
    // Gateway rotasini kaydet
    this.updateRoute(packet.source, fromNeighborId, packet.hopCount, true);

    if (this.onGatewayFound) {
      this.onGatewayFound(packet.source, packet.hopCount);
    }

    // Duyuruyu ilet
    this.forwardPacket(packet);
  }

  private handleRouteRequest(fromNeighborId: string, packet: MeshPacket): void {
    // Hedef biz miyiz?
    if (packet.destination === this.peerId) {
      // Rota yanitini gonder
      const reply: MeshPacket = {
        id: generateMessageId(),
        type: MeshPacketType.ROUTE_REPLY,
        source: this.peerId,
        destination: packet.source,
        ttl: MAX_TTL,
        hopCount: 0,
        hops: [this.peerId],
        payload: new Uint8Array(0),
        timestamp: Date.now(),
      };
      this.routePacket(reply);
    } else {
      // Hedefe rotamiz var mi?
      const route = this.routingTable.get(packet.destination);
      if (route) {
        // Rota yanitini gonder (proxy)
        const reply: MeshPacket = {
          id: generateMessageId(),
          type: MeshPacketType.ROUTE_REPLY,
          source: packet.destination,
          destination: packet.source,
          ttl: MAX_TTL,
          hopCount: route.hopCount,
          hops: [this.peerId],
          payload: new Uint8Array(0),
          timestamp: Date.now(),
        };
        this.routePacket(reply);
      }

      // RREQ'i ilet
      this.forwardPacket(packet);
    }
  }

  private handleRouteReply(packet: MeshPacket): void {
    if (packet.destination === this.peerId) {
      // Rota bulundu!
      this.updateRoute(packet.source, packet.hops[packet.hops.length - 1], packet.hopCount);
    } else {
      this.forwardPacket(packet);
    }
  }

  // === Routing ===

  /** Paketi en iyi rotadan gonder */
  private routePacket(packet: MeshPacket): void {
    // Dogrudan komsu mu?
    const route = this.routingTable.get(packet.destination);

    if (route && Date.now() - route.lastSeen < ROUTE_EXPIRY) {
      // Bilinen rota uzerinden gonder
      if (this.onSendToNeighbor) {
        const forwarded = { ...packet, ttl: packet.ttl - 1, hopCount: packet.hopCount + 1 };
        forwarded.hops = [...packet.hops, this.peerId];
        this.onSendToNeighbor(route.nextHop, forwarded);
      }
    } else {
      // Rota bilinmiyor, flood yap
      this.floodPacket(packet);
    }
  }

  /** Paketi ilet (TTL azalt, hop ekle) */
  private forwardPacket(packet: MeshPacket): void {
    if (packet.ttl <= 1) return; // TTL bitti

    const forwarded: MeshPacket = {
      ...packet,
      ttl: packet.ttl - 1,
      hopCount: packet.hopCount + 1,
      hops: [...packet.hops, this.peerId],
    };

    if (packet.destination === '*') {
      // Broadcast - tum komsuLara gonder
      this.floodPacket(forwarded);
    } else {
      this.routePacket(forwarded);
    }
  }

  /** Paketi tum komsulara flood et */
  private floodPacket(packet: MeshPacket): void {
    if (this.onBroadcastLocal) {
      this.onBroadcastLocal(packet);
    }
  }

  // === Rota Tablosu ===

  private updateRoute(
    destination: string,
    nextHop: string,
    hopCount: number,
    isGateway: boolean = false
  ): void {
    const existing = this.routingTable.get(destination);

    // Daha kisa rota veya yeni rota
    if (!existing || hopCount < existing.hopCount || Date.now() - existing.lastSeen > ROUTE_EXPIRY) {
      this.routingTable.set(destination, {
        destination,
        nextHop,
        hopCount,
        lastSeen: Date.now(),
        isGateway,
      });
    }
  }

  /** En yakin gateway'i bul */
  private findNearestGateway(): RouteEntry | null {
    let nearest: RouteEntry | null = null;

    for (const route of this.routingTable.values()) {
      if (route.isGateway && Date.now() - route.lastSeen < ROUTE_EXPIRY) {
        if (!nearest || route.hopCount < nearest.hopCount) {
          nearest = route;
        }
      }
    }

    return nearest;
  }

  // === Seen Cache ===

  private hasSeen(packetId: string): boolean {
    return this.seenPackets.has(packetId);
  }

  private markSeen(packetId: string): void {
    this.seenPackets.add(packetId);
    this.seenQueue.push(packetId);

    // Cache boyutunu sinirla
    while (this.seenQueue.length > SEEN_CACHE_SIZE) {
      const old = this.seenQueue.shift();
      if (old) this.seenPackets.delete(old);
    }
  }

  // === Kesfetme ===

  /** Peer kesfetme paketi gonder */
  private sendDiscovery(): void {
    const packet: MeshPacket = {
      id: generateMessageId(),
      type: MeshPacketType.DISCOVERY,
      source: this.peerId,
      destination: '*',
      ttl: MAX_TTL,
      hopCount: 0,
      hops: [this.peerId],
      payload: new Uint8Array(0),
      timestamp: Date.now(),
    };

    this.markSeen(packet.id);
    this.floodPacket(packet);
  }

  /** Gateway duyurusu gonder */
  private announceGateway(): void {
    const packet: MeshPacket = {
      id: generateMessageId(),
      type: MeshPacketType.GATEWAY_ANNOUNCE,
      source: this.peerId,
      destination: '*',
      ttl: MAX_TTL,
      hopCount: 0,
      hops: [this.peerId],
      payload: new Uint8Array(0),
      timestamp: Date.now(),
    };

    this.markSeen(packet.id);
    this.floodPacket(packet);
  }

  // === Durum ===

  /** Rota tablosunu al */
  getRoutes(): RouteEntry[] {
    return Array.from(this.routingTable.values());
  }

  /** Bilinen gateway'leri al */
  getGateways(): RouteEntry[] {
    return this.getRoutes().filter(r => r.isGateway);
  }

  /** Peer sayisi */
  getKnownPeerCount(): number {
    return this.routingTable.size;
  }

  /** Bu node gateway mi? */
  getIsGateway(): boolean {
    return this.isGateway;
  }

  /** Peer ID */
  getPeerId(): string {
    return this.peerId;
  }

  /** Temizlik */
  destroy(): void {
    this.stop();
    this.onSendToNeighbor = null;
    this.onBroadcastLocal = null;
    this.onMessageReceived = null;
    this.onGatewayFound = null;
  }
}

// === Serialize / Deserialize ===

export function serializeMeshPacket(packet: MeshPacket): string {
  return JSON.stringify({
    ...packet,
    payload: Array.from(packet.payload),
  });
}

export function deserializeMeshPacket(json: string): MeshPacket {
  const data = JSON.parse(json);
  return {
    ...data,
    payload: new Uint8Array(data.payload),
  };
}
