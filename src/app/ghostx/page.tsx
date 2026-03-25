'use client';

import React from 'react';
import { GhostXProvider, useGhostX } from './components/GhostXProvider';
import RoomLobby from './components/RoomLobby';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';

function GhostXApp() {
  const { state } = useGhostX();

  // Panik sonrasi veya ilk giris
  if (!state.isInitialized || state.isPanicking) {
    return <RoomLobby />;
  }

  // Ana arayuz: Sidebar + Chat
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
    }}>
      <Sidebar />
      <ChatRoom />
    </div>
  );
}

export default function GhostXPage() {
  return (
    <GhostXProvider>
      <GhostXApp />
    </GhostXProvider>
  );
}
