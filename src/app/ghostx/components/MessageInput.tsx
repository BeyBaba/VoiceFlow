'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useGhostX } from './GhostXProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Kaybolan mesaj sureleri
const DISAPPEAR_OPTIONS = [
  { label: 'Kapali', value: 0 },
  { label: '5 saniye', value: 5000 },
  { label: '30 saniye', value: 30000 },
  { label: '1 dakika', value: 60000 },
  { label: '5 dakika', value: 300000 },
];

export default function MessageInput() {
  const { sendMessage, state } = useGhostX();
  const [text, setText] = useState('');
  const [disappearAfter, setDisappearAfter] = useState(0);
  const [showDisappearMenu, setShowDisappearMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !state.currentRoom) return;

    sendMessage(trimmed, disappearAfter || undefined);
    setText('');

    // Textarea yuksekligini sifirla
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
    }
  }, [text, disappearAfter, sendMessage, state.currentRoom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = '20px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  if (!state.currentRoom) return null;

  const activeDisappear = DISAPPEAR_OPTIONS.find(o => o.value === disappearAfter);

  return (
    <div style={{
      backgroundColor: '#202c33',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      borderTop: '1px solid #222d34',
    }}>
      {/* Kaybolan mesaj timer */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDisappearMenu(!showDisappearMenu)}
          title="Kaybolan mesaj ayari"
          style={{
            background: 'none',
            border: 'none',
            color: disappearAfter > 0 ? '#00a884' : '#8696a0',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &#9200;
        </button>

        <AnimatePresence>
          {showDisappearMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                backgroundColor: '#233138',
                borderRadius: '8px',
                overflow: 'hidden',
                minWidth: '150px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 100,
              }}
            >
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: '#8696a0',
                borderBottom: '1px solid #222d34',
              }}>
                Kaybolan Mesaj
              </div>
              {DISAPPEAR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDisappearAfter(opt.value);
                    setShowDisappearMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: opt.value === disappearAfter ? '#2a3942' : 'none',
                    border: 'none',
                    color: opt.value === disappearAfter ? '#00a884' : '#e9edef',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mesaj girisi */}
      <div style={{
        flex: 1,
        backgroundColor: '#2a3942',
        borderRadius: '8px',
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative',
      }}>
        {/* Kaybolan mesaj badge */}
        {disappearAfter > 0 && (
          <div style={{
            position: 'absolute',
            top: '-24px',
            left: '12px',
            backgroundColor: '#00a88433',
            color: '#00a884',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            &#9200; {activeDisappear?.label}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz..."
          rows={1}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#e9edef',
            fontSize: '14px',
            lineHeight: '20px',
            resize: 'none',
            height: '20px',
            maxHeight: '120px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Gonder butonu */}
      <motion.button
        onClick={handleSend}
        whileTap={{ scale: 0.9 }}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: text.trim() ? '#00a884' : '#3b4a54',
          border: 'none',
          cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s',
          flexShrink: 0,
        }}
      >
        {/* Gonder ok ikonu */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
            fill={text.trim() ? '#111b21' : '#8696a0'}
          />
        </svg>
      </motion.button>
    </div>
  );
}
