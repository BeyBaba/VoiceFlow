'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isActive: boolean;
  onCorrectPassword: () => void;
  onDuressPassword: () => void;
}

/**
 * Baski Sifresi (Duress Password) Ekrani
 *
 * Iki sifre vardir:
 * 1. Normal sifre: Uygulamayi acar
 * 2. Baski sifresi: Uygulama "normal" gorunur ama arka planda
 *    tum verileri geri dondurulemez sekilde siler ve
 *    sahte bos bir chat ekrani gosterir
 *
 * Ornek: Birisi seni zorlayarak uygulamayi actirirsa,
 * baski sifresini girersin -> o kisi bos bir chat gorur,
 * ama aslinda tum veriler silinmistir.
 */
export default function DuressScreen({ isActive, onCorrectPassword, onDuressPassword }: Props) {
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [showDuressChat, setShowDuressChat] = useState(false);

  // Sifreleri localStorage'dan DEGIL, state'den al
  // Gercek implementasyonda kullanici bunlari ayarlar ekranindan belirler
  const CORRECT_PIN = '1234';  // Normal sifre
  const DURESS_PIN = '0000';   // Baski sifresi

  const handleSubmit = useCallback(() => {
    if (password === CORRECT_PIN) {
      setPassword('');
      onCorrectPassword();
    } else if (password === DURESS_PIN) {
      // Baski sifresi girildi!
      // 1. Arka planda tum verileri sil
      onDuressPassword();
      // 2. Sahte bos chat ekrani goster
      setShowDuressChat(true);
      setPassword('');
    } else {
      // Yanlis sifre
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPassword('');
      }, 500);
    }
  }, [password, onCorrectPassword, onDuressPassword]);

  // Numpad tuslarini dinle
  const handleKeyPress = useCallback((digit: string) => {
    if (password.length < 4) {
      const newPassword = password + digit;
      setPassword(newPassword);

      // 4 haneli olunca otomatik kontrol
      if (newPassword.length === 4) {
        setTimeout(() => {
          if (newPassword === CORRECT_PIN) {
            setPassword('');
            onCorrectPassword();
          } else if (newPassword === DURESS_PIN) {
            onDuressPassword();
            setShowDuressChat(true);
            setPassword('');
          } else {
            setShake(true);
            setTimeout(() => {
              setShake(false);
              setPassword('');
            }, 500);
          }
        }, 100);
      }
    }
  }, [password, onCorrectPassword, onDuressPassword]);

  // Klavye dinle
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        setPassword(p => p.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleKeyPress, handleSubmit]);

  if (!isActive) return null;

  // Sahte bos chat ekrani (baski sifresi sonrasi)
  if (showDuressChat) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0b141a',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sahte header */}
        <div style={{
          height: '60px',
          backgroundColor: '#202c33',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #222d34',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#2a3942',
            marginRight: '12px',
          }} />
          <div>
            <div style={{ color: '#e9edef', fontSize: '15px' }}>GhostX</div>
            <div style={{ color: '#8696a0', fontSize: '12px' }}>Baglanti bekleniyor...</div>
          </div>
        </div>

        {/* Sahte bos chat alani */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8696a0',
          fontSize: '14px',
        }}>
          Henuz mesaj yok
        </div>

        {/* Sahte mesaj girisi */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#202c33',
          borderTop: '1px solid #222d34',
        }}>
          <div style={{
            backgroundColor: '#2a3942',
            borderRadius: '8px',
            padding: '12px',
            color: '#8696a0',
            fontSize: '14px',
          }}>
            Mesaj yaz...
          </div>
        </div>
      </div>
    );
  }

  // PIN girisi ekrani
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0b141a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Logo */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00a884, #005c4b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '24px',
      }}>
        &#128123;
      </div>

      <h2 style={{
        color: '#e9edef',
        fontSize: '20px',
        fontWeight: 300,
        marginBottom: '32px',
      }}>
        GhostX Kilidi
      </h2>

      {/* PIN noktalari */}
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: i < password.length ? '#00a884' : 'transparent',
              border: `2px solid ${i < password.length ? '#00a884' : '#3b4a54'}`,
              transition: 'all 0.15s',
            }}
          />
        ))}
      </motion.div>

      {/* Numpad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        maxWidth: '280px',
      }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
          if (key === '') return <div key="empty" />;

          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9, backgroundColor: '#3b4a54' }}
              onClick={() => {
                if (key === 'del') {
                  setPassword(p => p.slice(0, -1));
                } else {
                  handleKeyPress(key);
                }
              }}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#202c33',
                border: 'none',
                color: '#e9edef',
                fontSize: key === 'del' ? '16px' : '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
            >
              {key === 'del' ? '&#9003;' : key}
            </motion.button>
          );
        })}
      </div>

      {/* Alt bilgi */}
      <p style={{
        marginTop: '32px',
        color: '#667781',
        fontSize: '12px',
        textAlign: 'center',
      }}>
        4 haneli PIN giriniz
      </p>
    </div>
  );
}
