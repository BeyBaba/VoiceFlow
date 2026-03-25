// GhostX - Hayalet Chat Sistemi Tip Tanimlari

// === Kripto Tipleri ===
export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export interface RatchetHeader {
  dh: Uint8Array;       // Gondericinin guncel DH public key'i
  pn: number;           // Onceki zincir uzunlugu
  n: number;            // Mesaj numarasi
}

export interface RatchetMessage {
  header: RatchetHeader;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export interface RatchetState {
  DHs: KeyPair;                           // Bizim DH ratchet keypair'imiz
  DHr: Uint8Array | null;                 // Karsi tarafin DH public key'i
  RK: Uint8Array;                         // Root key (32 byte)
  CKs: Uint8Array | null;                 // Gonderme zincir anahtari
  CKr: Uint8Array | null;                 // Alma zincir anahtari
  Ns: number;                             // Gonderme mesaj sayaci
  Nr: number;                             // Alma mesaj sayaci
  PN: number;                             // Onceki gonderme zincir uzunlugu
  MKSKIPPED: Map<string, SkippedKey>;     // Atlanan mesaj anahtarlari
}

export interface SkippedKey {
  key: Uint8Array;
  timestamp: number;
}

// === Mesaj Tipleri ===
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system' | 'screenshot-alert';

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface DecryptedMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  timestamp: number;
  status: DeliveryStatus;
  disappearAfter?: number;    // Kaybolan mesaj suresi (ms)
  disappearAt?: number;       // Silinecegi zaman (timestamp)
  mediaData?: Uint8Array;     // Medya verisi (RAM'de)
  mediaMimeType?: string;
}

export interface SystemMessage {
  type: 'peer-joined' | 'peer-left' | 'screenshot-attempt' | 'room-created' | 'panic';
  peerId?: string;
  peerName?: string;
  timestamp: number;
}

// === Oda Tipleri ===
export interface Room {
  id: string;
  inviteCode: string;
  createdAt: number;
  peers: Map<string, PeerInfo>;
  isActive: boolean;
  defaultDisappearTimer?: number;
}

export interface PeerInfo {
  id: string;
  name: string;
  publicKey: Uint8Array;
  isConnected: boolean;
  lastSeen: number;
}

// === Signaling Tipleri ===
export type SignalType = 'offer' | 'answer' | 'ice' | 'key-exchange' | 'peer-join' | 'peer-leave';

export interface SignalMessage {
  roomId: string;
  peerId: string;
  peerName: string;
  type: SignalType;
  payload: string;  // JSON stringified
  timestamp: number;
}

// === P2P Tipleri ===
export type P2PMessageType =
  | 'chat'              // Normal mesaj
  | 'ack'               // Mesaj alindi
  | 'read'              // Mesaj okundu
  | 'typing'            // Yaziyor...
  | 'screenshot-alert'  // Screenshot uyarisi
  | 'key-exchange'      // Anahtar degisimi
  | 'media-chunk'       // Medya parcasi
  | 'media-complete';   // Medya tamamlandi

export interface P2PMessage {
  type: P2PMessageType;
  id: string;
  senderId: string;
  payload: string;
  timestamp: number;
}

// === UI State Tipleri ===
export interface GhostXState {
  isInitialized: boolean;
  currentRoom: Room | null;
  rooms: Room[];
  messages: Map<string, DecryptedMessage[]>;
  myPeerId: string;
  myPeerName: string;
  myKeyPair: KeyPair | null;
  isPanicking: boolean;
  connectionMode: 'webrtc' | 'bluetooth' | 'wifi-direct' | 'disconnected';
}

export type GhostXAction =
  | { type: 'INIT'; peerId: string; peerName: string; keyPair: KeyPair }
  | { type: 'CREATE_ROOM'; room: Room }
  | { type: 'JOIN_ROOM'; room: Room }
  | { type: 'LEAVE_ROOM'; roomId: string }
  | { type: 'ADD_MESSAGE'; roomId: string; message: DecryptedMessage }
  | { type: 'REMOVE_MESSAGE'; roomId: string; messageId: string }
  | { type: 'UPDATE_MESSAGE_STATUS'; roomId: string; messageId: string; status: DeliveryStatus }
  | { type: 'PEER_JOINED'; roomId: string; peer: PeerInfo }
  | { type: 'PEER_LEFT'; roomId: string; peerId: string }
  | { type: 'PANIC' }
  | { type: 'SET_CONNECTION_MODE'; mode: GhostXState['connectionMode'] };
