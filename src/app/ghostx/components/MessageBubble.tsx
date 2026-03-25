'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { DecryptedMessage } from '@/lib/ghostx/types';

interface Props {
  message: DecryptedMessage;
  isOwn: boolean;
}

// Saat formatla (HH:MM)
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Avatar rengi
function nameToColor(name: string): string {
  const colors = [
    '#53bdeb', '#e37400', '#ff6b6b', '#a855f7',
    '#f59e0b', '#10b981', '#ec4899', '#06b6d4',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Tik isareti
function StatusTick({ status }: { status: string }) {
  switch (status) {
    case 'sending':
      return <span style={{ color: '#8696a0', fontSize: '12px' }}>&#9201;</span>;
    case 'sent':
      return <span style={{ color: '#8696a0', fontSize: '14px' }}>&#10003;</span>;
    case 'delivered':
      return <span style={{ color: '#8696a0', fontSize: '14px' }}>&#10003;&#10003;</span>;
    case 'read':
      return <span style={{ color: '#53bdeb', fontSize: '14px' }}>&#10003;&#10003;</span>;
    default:
      return null;
  }
}

export default function MessageBubble({ message, isOwn }: Props) {
  // Sistem mesaji
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          padding: '4px 16px',
          margin: '4px 0',
        }}
      >
        <span style={{
          backgroundColor: '#182229',
          color: '#8696a0',
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '6px',
          display: 'inline-block',
        }}>
          {message.content}
        </span>
      </motion.div>
    );
  }

  // Screenshot uyarisi
  if (message.type === 'screenshot-alert') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          textAlign: 'center',
          padding: '8px 16px',
          margin: '4px 0',
        }}
      >
        <span style={{
          backgroundColor: '#3b1c1c',
          color: '#ff6b6b',
          fontSize: '13px',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 600,
          border: '1px solid #ff6b6b33',
        }}>
          &#9888; {message.content}
        </span>
      </motion.div>
    );
  }

  // Normal mesaj baloncugu
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        padding: '1px 16px',
        marginBottom: '2px',
      }}
    >
      <div style={{
        maxWidth: '65%',
        minWidth: '100px',
        position: 'relative',
      }}>
        {/* Mesaj baloncugu */}
        <div style={{
          backgroundColor: isOwn ? '#005c4b' : '#202c33',
          borderRadius: '7.5px',
          borderTopRightRadius: isOwn ? '0' : '7.5px',
          borderTopLeftRadius: isOwn ? '7.5px' : '0',
          padding: '6px 7px 8px 9px',
          position: 'relative',
        }}>
          {/* Kuyruk (tail) - SVG */}
          <div style={{
            position: 'absolute',
            top: 0,
            [isOwn ? 'right' : 'left']: '-8px',
            width: '8px',
            height: '13px',
          }}>
            <svg viewBox="0 0 8 13" width="8" height="13">
              {isOwn ? (
                <path d="M1,0 L8,0 L8,6 C8,6 5,8 1,13 L1,0 Z" fill="#005c4b" />
              ) : (
                <path d="M7,0 L0,0 L0,6 C0,6 3,8 7,13 L7,0 Z" fill="#202c33" />
              )}
            </svg>
          </div>

          {/* Gonderici adi (baskalarinin mesajlari icin) */}
          {!isOwn && (
            <div style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: nameToColor(message.senderName),
              marginBottom: '2px',
            }}>
              {message.senderName}
            </div>
          )}

          {/* Mesaj icerigi */}
          <div style={{
            fontSize: '14.2px',
            color: '#e9edef',
            lineHeight: '19px',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}>
            {message.content}

            {/* Saat + tik (mesaj icerisinde sag altta) */}
            <span style={{
              float: 'right',
              marginLeft: '12px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}>
              {/* Kaybolan mesaj ikonu */}
              {message.disappearAfter && (
                <span style={{ fontSize: '11px', color: '#8696a0' }} title="Kaybolan mesaj">
                  &#9200;
                </span>
              )}
              <span style={{
                fontSize: '11px',
                color: isOwn ? '#ffffff99' : '#ffffff80',
              }}>
                {formatTime(message.timestamp)}
              </span>
              {isOwn && <StatusTick status={message.status} />}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
