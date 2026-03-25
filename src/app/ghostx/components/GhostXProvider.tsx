'use client';

// GhostX Context Provider
// Tum GhostX state'ini, kripto, peer manager ve memory store'u yonetir
// Hicbir sey diske yazilmaz, her sey RAM'de

import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  GhostXState,
  GhostXAction,
  DecryptedMessage,
  Room,
  KeyPair,
  PeerInfo,
} from '@/lib/ghostx/types';
import { MemoryStore } from '@/lib/ghostx/memory-store';
import { PeerManager } from '@/lib/ghostx/peer-manager';
import {
  initCrypto,
  generateKeyPair,
  generatePeerId,
  generateRoomCode,
  generateMessageId,
  secureWipeAll,
} from '@/lib/ghostx/crypto';

// === State Reducer ===

const initialState: GhostXState = {
  isInitialized: false,
  currentRoom: null,
  rooms: [],
  messages: new Map(),
  myPeerId: '',
  myPeerName: '',
  myKeyPair: null,
  isPanicking: false,
  connectionMode: 'disconnected',
};

function ghostxReducer(state: GhostXState, action: GhostXAction): GhostXState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        isInitialized: true,
        myPeerId: action.peerId,
        myPeerName: action.peerName,
        myKeyPair: action.keyPair,
      };

    case 'CREATE_ROOM':
    case 'JOIN_ROOM':
      return {
        ...state,
        currentRoom: action.room,
        rooms: [...state.rooms, action.room],
        connectionMode: 'webrtc',
      };

    case 'LEAVE_ROOM': {
      const newRooms = state.rooms.filter(r => r.id !== action.roomId);
      return {
        ...state,
        currentRoom: state.currentRoom?.id === action.roomId ? null : state.currentRoom,
        rooms: newRooms,
        connectionMode: newRooms.length === 0 ? 'disconnected' : state.connectionMode,
      };
    }

    case 'ADD_MESSAGE': {
      const newMessages = new Map(state.messages);
      const roomMsgs = newMessages.get(action.roomId) || [];
      newMessages.set(action.roomId, [...roomMsgs, action.message]);
      return { ...state, messages: newMessages };
    }

    case 'REMOVE_MESSAGE': {
      const newMessages = new Map(state.messages);
      const msgs = newMessages.get(action.roomId);
      if (msgs) {
        newMessages.set(action.roomId, msgs.filter(m => m.id !== action.messageId));
      }
      return { ...state, messages: newMessages };
    }

    case 'UPDATE_MESSAGE_STATUS': {
      const newMessages = new Map(state.messages);
      const msgs = newMessages.get(action.roomId);
      if (msgs) {
        newMessages.set(action.roomId, msgs.map(m =>
          m.id === action.messageId ? { ...m, status: action.status } : m
        ));
      }
      return { ...state, messages: newMessages };
    }

    case 'PEER_JOINED': {
      if (!state.currentRoom) return state;
      const newPeers = new Map(state.currentRoom.peers);
      newPeers.set(action.peer.id, action.peer);
      return {
        ...state,
        currentRoom: { ...state.currentRoom, peers: newPeers },
      };
    }

    case 'PEER_LEFT': {
      if (!state.currentRoom) return state;
      const newPeers = new Map(state.currentRoom.peers);
      newPeers.delete(action.peerId);
      return {
        ...state,
        currentRoom: { ...state.currentRoom, peers: newPeers },
      };
    }

    case 'PANIC':
      return {
        ...initialState,
        isPanicking: true,
      };

    case 'SET_CONNECTION_MODE':
      return { ...state, connectionMode: action.mode };

    default:
      return state;
  }
}

// === Context ===

interface GhostXContextType {
  state: GhostXState;
  initialize: (peerName: string) => Promise<void>;
  createRoom: () => Promise<string>;
  joinRoom: (inviteCode: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (text: string, disappearAfter?: number) => void;
  sendScreenshotAlert: () => void;
  panic: () => void;
  selectRoom: (roomId: string) => void;
}

const GhostXContext = createContext<GhostXContextType | null>(null);

export function useGhostX(): GhostXContextType {
  const ctx = useContext(GhostXContext);
  if (!ctx) throw new Error('useGhostX must be used within GhostXProvider');
  return ctx;
}

// === Provider ===

export function GhostXProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ghostxReducer, initialState);
  const storeRef = useRef<MemoryStore>(new MemoryStore());
  const peerManagerRef = useRef<PeerManager | null>(null);
  const keyPairRef = useRef<KeyPair | null>(null);

  // Kripto motoru baslat
  const initialize = useCallback(async (peerName: string) => {
    await initCrypto();
    const keyPair = generateKeyPair();
    const peerId = generatePeerId();
    keyPairRef.current = keyPair;
    dispatch({ type: 'INIT', peerId, peerName, keyPair });
  }, []);

  // Oda olustur
  const createRoom = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/ghostx/room', { method: 'POST' });
    const data = await response.json();
    const roomId = data.roomId as string;

    const room: Room = {
      id: roomId,
      inviteCode: roomId,
      createdAt: Date.now(),
      peers: new Map(),
      isActive: true,
    };

    storeRef.current.addRoom(room);
    dispatch({ type: 'CREATE_ROOM', room });

    // Peer manager baslat
    if (keyPairRef.current) {
      const pm = new PeerManager(
        roomId,
        state.myPeerId,
        state.myPeerName,
        keyPairRef.current
      );
      setupPeerManagerHandlers(pm, roomId);
      await pm.joinRoom();
      peerManagerRef.current = pm;
    }

    return roomId;
  }, [state.myPeerId, state.myPeerName]);

  // Odaya katil
  const joinRoom = useCallback(async (inviteCode: string): Promise<void> => {
    // Oda varligini kontrol et
    const response = await fetch(`/api/ghostx/room?roomId=${encodeURIComponent(inviteCode)}`);
    if (!response.ok) throw new Error('Oda bulunamadi');

    const room: Room = {
      id: inviteCode,
      inviteCode,
      createdAt: Date.now(),
      peers: new Map(),
      isActive: true,
    };

    storeRef.current.addRoom(room);
    dispatch({ type: 'JOIN_ROOM', room });

    // Peer manager baslat
    if (keyPairRef.current) {
      const pm = new PeerManager(
        inviteCode,
        state.myPeerId,
        state.myPeerName,
        keyPairRef.current
      );
      setupPeerManagerHandlers(pm, inviteCode);
      await pm.joinRoom();
      peerManagerRef.current = pm;
    }
  }, [state.myPeerId, state.myPeerName]);

  // Peer manager event handler'larini ayarla
  const setupPeerManagerHandlers = useCallback((pm: PeerManager, roomId: string) => {
    pm.onMessage = (_peerId: string, message: DecryptedMessage) => {
      storeRef.current.addMessage(roomId, message);
      dispatch({ type: 'ADD_MESSAGE', roomId, message });

      // Kaybolan mesaj zamanlayicisi
      if (message.disappearAfter && message.disappearAfter > 0) {
        setTimeout(() => {
          storeRef.current.removeMessage(roomId, message.id);
          dispatch({ type: 'REMOVE_MESSAGE', roomId, messageId: message.id });
        }, message.disappearAfter);
      }
    };

    pm.onPeerJoined = (peerId: string, peerName: string) => {
      const peer: PeerInfo = {
        id: peerId,
        name: peerName,
        publicKey: new Uint8Array(32),
        isConnected: true,
        lastSeen: Date.now(),
      };
      dispatch({ type: 'PEER_JOINED', roomId, peer });

      // Sistem mesaji
      const sysMsg: DecryptedMessage = {
        id: generateMessageId(),
        roomId,
        senderId: 'system',
        senderName: 'GhostX',
        type: 'system',
        content: `${peerName} odaya katildi`,
        timestamp: Date.now(),
        status: 'read',
      };
      dispatch({ type: 'ADD_MESSAGE', roomId, message: sysMsg });
    };

    pm.onPeerLeft = (peerId: string, peerName: string) => {
      dispatch({ type: 'PEER_LEFT', roomId, peerId });

      const sysMsg: DecryptedMessage = {
        id: generateMessageId(),
        roomId,
        senderId: 'system',
        senderName: 'GhostX',
        type: 'system',
        content: `${peerName} odadan ayrildi`,
        timestamp: Date.now(),
        status: 'read',
      };
      dispatch({ type: 'ADD_MESSAGE', roomId, message: sysMsg });
    };

    pm.onScreenshotAlert = (_peerId: string, peerName: string) => {
      const alertMsg: DecryptedMessage = {
        id: generateMessageId(),
        roomId,
        senderId: 'system',
        senderName: 'GhostX',
        type: 'screenshot-alert',
        content: `${peerName} screenshot almaya calisti!`,
        timestamp: Date.now(),
        status: 'read',
      };
      dispatch({ type: 'ADD_MESSAGE', roomId, message: alertMsg });
    };
  }, []);

  // Mesaj gonder
  const sendMessage = useCallback((text: string, disappearAfter?: number) => {
    if (!peerManagerRef.current || !state.currentRoom) return;

    peerManagerRef.current.sendMessage(text, disappearAfter);

    // Kendi mesajimizi ekle
    const msg: DecryptedMessage = {
      id: generateMessageId(),
      roomId: state.currentRoom.id,
      senderId: state.myPeerId,
      senderName: state.myPeerName,
      type: 'text',
      content: text,
      timestamp: Date.now(),
      status: 'sent',
      disappearAfter,
    };

    storeRef.current.addMessage(state.currentRoom.id, msg);
    dispatch({ type: 'ADD_MESSAGE', roomId: state.currentRoom.id, message: msg });

    // Kaybolan mesaj
    if (disappearAfter && disappearAfter > 0) {
      setTimeout(() => {
        if (state.currentRoom) {
          storeRef.current.removeMessage(state.currentRoom.id, msg.id);
          dispatch({ type: 'REMOVE_MESSAGE', roomId: state.currentRoom.id, messageId: msg.id });
        }
      }, disappearAfter);
    }
  }, [state.currentRoom, state.myPeerId, state.myPeerName]);

  // Screenshot uyarisi gonder
  const sendScreenshotAlert = useCallback(() => {
    if (peerManagerRef.current) {
      peerManagerRef.current.sendScreenshotAlert();
    }
  }, []);

  // Odadan ayril
  const leaveRoom = useCallback(() => {
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
    }
    if (state.currentRoom) {
      storeRef.current.removeRoom(state.currentRoom.id);
      dispatch({ type: 'LEAVE_ROOM', roomId: state.currentRoom.id });
    }
  }, [state.currentRoom]);

  // Oda sec
  const selectRoom = useCallback((roomId: string) => {
    const room = storeRef.current.getRoom(roomId);
    if (room) {
      dispatch({ type: 'JOIN_ROOM', room });
    }
  }, []);

  // === PANIK BUTONU ===
  const panic = useCallback(() => {
    // 1. Peer baglantilarini kes
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
    }

    // 2. Memory store'u sil (tum buffer'lar sifirlanir)
    storeRef.current.panic();

    // 3. Anahtar ciftini sil
    if (keyPairRef.current) {
      secureWipeAll(keyPairRef.current.publicKey, keyPairRef.current.secretKey);
      keyPairRef.current = null;
    }

    // 4. State'i sifirla
    dispatch({ type: 'PANIC' });

    // 5. Yeni bos store olustur
    storeRef.current = new MemoryStore();
  }, []);

  // Klavye kisayolu: Ctrl+Shift+Delete = PANIK
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        panic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panic]);

  // Sayfa kapatildiginda temizlik
  useEffect(() => {
    const handleUnload = () => {
      panic();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [panic]);

  const contextValue: GhostXContextType = {
    state,
    initialize,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendScreenshotAlert,
    panic,
    selectRoom,
  };

  return (
    <GhostXContext.Provider value={contextValue}>
      {children}
    </GhostXContext.Provider>
  );
}
