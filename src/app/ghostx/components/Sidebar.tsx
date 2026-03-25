'use client';

import React, { useState } from 'react';
import { useGhostX } from './GhostXProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Avatar rengi: isimden deterministik renk uret
function nameToColor(name: string): string {
  const colors = [
    '#00a884', '#53bdeb', '#e37400', '#ff6b6b',
    '#a855f7', '#f59e0b', '#10b981', '#ec4899',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Sidebar() {
  const { state, createRoom, joinRoom, panic, selectRoom } = useGhostX();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [panicHoldTimer, setPanicHoldTimer] = useState<NodeJS.Timeout | null>(null);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      await createRoom();
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinRoom(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
    } catch {
      alert('Oda bulunamadi veya suresi doldu');
    }
  };

  // Panik butonu: 3 saniye uzun basma
  const handlePanicDown = () => {
    const timer = setTimeout(() => {
      panic();
    }, 3000);
    setPanicHoldTimer(timer);
    setShowPanicConfirm(true);
  };

  const handlePanicUp = () => {
    if (panicHoldTimer) {
      clearTimeout(panicHoldTimer);
      setPanicHoldTimer(null);
    }
    setShowPanicConfirm(false);
  };

  const rooms = state.rooms;
  const currentRoom = state.currentRoom;

  return (
    <div style={{
      width: '300px',
      height: '100%',
      backgroundColor: '#111b21',
      borderRight: '1px solid #222d34',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#202c33',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00a884, #005c4b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            G
          </div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#e9edef' }}>
            GhostX
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowJoinModal(true)}
            title="Odaya Katil"
            style={{
              background: 'none',
              border: 'none',
              color: '#aebac1',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{
          backgroundColor: '#202c33',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ color: '#8696a0', fontSize: '14px' }}>&#128269;</span>
          <input
            type="text"
            placeholder="Ara veya yeni sohbet basla"
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#e9edef',
              fontSize: '14px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Room List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rooms.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#8696a0',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>&#128274;</div>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>Henuz oda yok</p>
            <p style={{ fontSize: '12px', color: '#667781' }}>
              Yeni oda olustur veya davet koduyla katil
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {rooms.map((room) => {
              const isSelected = currentRoom?.id === room.id;
              const peerCount = room.peers.size;
              const lastMessage = state.messages.get(room.id)?.slice(-1)[0];

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => selectRoom(room.id)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#2a3942' : 'transparent',
                    borderBottom: '1px solid #222d34',
                    transition: 'background-color 0.15s',
                  }}
                  whileHover={{ backgroundColor: '#202c33' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: nameToColor(room.id),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {room.inviteCode.substring(0, 2)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#e9edef',
                      }}>
                        Oda {room.inviteCode}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#8696a0',
                      }}>
                        {peerCount > 0 ? `${peerCount} kisi` : ''}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#8696a0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                    }}>
                      {lastMessage ? lastMessage.content : 'Sifreli sohbet'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #222d34',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Yeni Oda */}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#00a884',
            color: '#111b21',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {isCreating ? 'Olusturuluyor...' : '+ Yeni Oda Olustur'}
        </button>

        {/* PANIK BUTONU */}
        <motion.button
          onMouseDown={handlePanicDown}
          onMouseUp={handlePanicUp}
          onMouseLeave={handlePanicUp}
          onTouchStart={handlePanicDown}
          onTouchEnd={handlePanicUp}
          animate={showPanicConfirm ? {
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 0.3 },
          } : {}}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: showPanicConfirm ? '#ff0000' : '#3b1c1c',
            color: showPanicConfirm ? '#fff' : '#ff6b6b',
            border: '1px solid #ff6b6b33',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            userSelect: 'none',
          }}
        >
          {showPanicConfirm ? 'BASILI TUT - 3 SN...' : 'PANIK - Her Seyi Sil'}
        </motion.button>
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#202c33',
                borderRadius: '12px',
                padding: '24px',
                width: '360px',
                maxWidth: '90vw',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#e9edef' }}>
                Odaya Katil
              </h3>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Davet kodunu gir (orn: ABC123)"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2a3942',
                  border: '1px solid #3b4a54',
                  borderRadius: '8px',
                  color: '#e9edef',
                  fontSize: '18px',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => setShowJoinModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: '#8696a0',
                    border: '1px solid #3b4a54',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Iptal
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length < 6}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: joinCode.length >= 6 ? '#00a884' : '#3b4a54',
                    color: joinCode.length >= 6 ? '#111b21' : '#8696a0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: joinCode.length >= 6 ? 'pointer' : 'default',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Katil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
