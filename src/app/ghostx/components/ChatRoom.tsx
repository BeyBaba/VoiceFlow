'use client';

import React, { useEffect, useRef } from 'react';
import { useGhostX } from './GhostXProvider';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

// WhatsApp tarzi doodle pattern (CSS ile)
const chatBgStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-30 30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  backgroundColor: '#0b141a',
};

export default function ChatRoom() {
  const { state } = useGhostX();
  const scrollRef = useRef<HTMLDivElement>(null);

  const room = state.currentRoom;
  const messages = room ? (state.messages.get(room.id) || []) : [];

  // Yeni mesaj gelince en alta scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Oda secili degil
  if (!room) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222e35',
        textAlign: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00a88420 0%, transparent 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
        }}>
          <div style={{ fontSize: '80px', opacity: 0.6 }}>&#128274;</div>
        </div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 300,
          color: '#e9edef',
          marginBottom: '12px',
        }}>
          GhostX
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#8696a0',
          maxWidth: '400px',
          lineHeight: '20px',
          marginBottom: '24px',
        }}>
          Uctan uca sifreli, iz birakmayan ozel sohbet.
          <br />
          Mesajlar sadece RAM&apos;de tutulur, uygulama kapandiginda yok olur.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#00a884',
          fontSize: '13px',
        }}>
          <span>&#128274;</span>
          <span>Mesajlariniz uctan uca sifrelenmistir</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <ChatHeader />

      {/* Mesaj alani */}
      <div ref={scrollRef} style={chatBgStyle}>
        {/* Sifreleme bildirimi */}
        <div style={{
          textAlign: 'center',
          padding: '8px 16px',
          marginBottom: '8px',
        }}>
          <span style={{
            backgroundColor: '#182229',
            color: '#ffd279',
            fontSize: '12px',
            padding: '6px 14px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            &#128274; Mesajlar uctan uca sifrelenmistir. GhostX dahil kimse okuyamaz.
          </span>
        </div>

        {/* Mesajlar */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === state.myPeerId}
          />
        ))}
      </div>

      <MessageInput />
    </div>
  );
}
