'use client';

import React, { useState, useCallback } from 'react';
import { useGhostX } from './GhostXProvider';
import { motion } from 'framer-motion';

export default function RoomLobby() {
  const { state, initialize } = useGhostX();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      await initialize(trimmed);
    } finally {
      setIsLoading(false);
    }
  }, [name, initialize]);

  if (state.isInitialized) return null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b141a',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          maxWidth: '420px',
          padding: '40px',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00a884, #005c4b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px',
          }}
        >
          &#128123;
        </motion.div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: 300,
          color: '#e9edef',
          marginBottom: '8px',
        }}>
          GhostX
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#8696a0',
          marginBottom: '32px',
          lineHeight: '20px',
        }}>
          Uctan uca sifreli, iz birakmayan ozel sohbet
        </p>

        {/* Isim girisi */}
        <div style={{
          backgroundColor: '#202c33',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            color: '#00a884',
            marginBottom: '8px',
            textAlign: 'left',
          }}>
            Gorunecek ismin
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Isim gir..."
            maxLength={20}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a3942',
              border: '1px solid #3b4a54',
              borderRadius: '8px',
              color: '#e9edef',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        <motion.button
          onClick={handleStart}
          disabled={!name.trim() || isLoading}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: name.trim() ? '#00a884' : '#3b4a54',
            color: name.trim() ? '#111b21' : '#8696a0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: name.trim() ? 'pointer' : 'default',
            transition: 'background-color 0.15s',
          }}
        >
          {isLoading ? 'Baslatiliyor...' : 'Giris Yap'}
        </motion.button>

        {/* Guvenlik notu */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {[
            'Mesajlar uctan uca sifrelenir',
            'Hicbir veri diske yazilmaz',
            'Uygulama kapandiginda her sey silinir',
            'Sunucu mesaj icerigi gormez',
          ].map((text, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#8696a0',
            }}>
              <span style={{ color: '#00a884' }}>&#10003;</span>
              {text}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
