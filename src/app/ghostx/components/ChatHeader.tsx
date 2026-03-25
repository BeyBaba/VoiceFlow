'use client';

import React, { useState } from 'react';
import { useGhostX } from './GhostXProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatHeader() {
  const { state, leaveRoom } = useGhostX();
  const [showMenu, setShowMenu] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const room = state.currentRoom;
  if (!room) return null;

  const peerCount = room.peers.size;
  const onlinePeers = Array.from(room.peers.values())
    .filter(p => p.isConnected)
    .map(p => p.name);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div style={{
        height: '60px',
        backgroundColor: '#202c33',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #222d34',
      }}>
        {/* Sol: Oda bilgisi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00a884, #005c4b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
          }}>
            {room.inviteCode.substring(0, 2)}
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '15px',
              fontWeight: 500,
              color: '#e9edef',
            }}>
              <span>Oda {room.inviteCode}</span>
              {/* Kilit ikonu - sifreli */}
              <span style={{ fontSize: '12px', color: '#00a884' }} title="Uctan uca sifreli">
                &#128274;
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#8696a0',
            }}>
              {peerCount > 0
                ? `${onlinePeers.slice(0, 3).join(', ')}${peerCount > 3 ? ` +${peerCount - 3}` : ''}`
                : 'Baska birinin katilmasini bekliyor...'
              }
            </p>
          </div>
        </div>

        {/* Sag: Menuler */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Peer sayisi badge */}
          <div style={{
            backgroundColor: '#00a884',
            color: '#111b21',
            borderRadius: '12px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {peerCount + 1} kisi
          </div>

          {/* Davet kodu */}
          <button
            onClick={() => setShowInvite(true)}
            title="Davet Kodu"
            style={{
              background: 'none',
              border: 'none',
              color: '#aebac1',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px',
            }}
          >
            &#128279;
          </button>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: 'none',
                border: 'none',
                color: '#aebac1',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px 8px',
              }}
            >
              &#8942;
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    backgroundColor: '#233138',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minWidth: '180px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={() => { setShowInvite(true); setShowMenu(false); }}
                    style={menuItemStyle}
                  >
                    Davet Kodu Goster
                  </button>
                  <button
                    onClick={() => { leaveRoom(); setShowMenu(false); }}
                    style={{ ...menuItemStyle, color: '#ff6b6b' }}
                  >
                    Odadan Ayril
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Davet Kodu Modal */}
      <AnimatePresence>
        {showInvite && (
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
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#202c33',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                width: '360px',
                maxWidth: '90vw',
              }}
            >
              <div style={{ fontSize: '14px', color: '#8696a0', marginBottom: '8px' }}>
                Davet Kodu
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#00a884',
                letterSpacing: '8px',
                marginBottom: '16px',
                fontFamily: 'monospace',
              }}>
                {room.inviteCode}
              </div>
              <p style={{ fontSize: '13px', color: '#8696a0', marginBottom: '20px' }}>
                Bu kodu arkadaslarinla paylas. Onlar da bu kodla odaya katilabilir.
              </p>
              <button
                onClick={handleCopyCode}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#00a884',
                  color: '#111b21',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Kopyalandi!' : 'Kodu Kopyala'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  color: '#e9edef',
  fontSize: '14px',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'block',
};
