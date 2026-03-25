'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type ShadowConfig,
  type ShadowIdentity,
  TTL_OPTIONS,
  formatRemainingTime,
  getRemainingTime,
} from '@/lib/ghostx/shadow-identity';

interface Props {
  identity: ShadowIdentity | null;
  onCreateIdentity: (name: string, config: ShadowConfig) => void;
  onRotateIdentity: () => void;
  onUpdateConfig: (config: Partial<ShadowConfig>) => void;
}

/**
 * Ucucu Kimlik Paneli
 * Sidebar'da gosterilir
 */
export default function ShadowIdentityPanel({
  identity,
  onCreateIdentity,
  onRotateIdentity,
  onUpdateConfig,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [remainingText, setRemainingText] = useState('');
  const [ttl, setTtl] = useState(24 * 60 * 60 * 1000);
  const [anonymous, setAnonymous] = useState(false);

  // Kalan sureyi guncelle
  useEffect(() => {
    if (!identity) return;

    const updateRemaining = () => {
      setRemainingText(formatRemainingTime(identity));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 30000); // Her 30 saniye
    return () => clearInterval(interval);
  }, [identity]);

  const handleRotate = useCallback(() => {
    onRotateIdentity();
  }, [onRotateIdentity]);

  if (!identity) return null;

  const remaining = getRemainingTime(identity);
  const isExpiringSoon = remaining < 60 * 60 * 1000 && remaining > 0; // 1 saatten az

  return (
    <div style={{ padding: '8px 16px' }}>
      {/* Kimlik karti */}
      <div style={{
        backgroundColor: '#111b21',
        borderRadius: '8px',
        padding: '12px',
        border: isExpiringSoon ? '1px solid #ffa94d44' : '1px solid transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: identity.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
            flexShrink: 0,
          }}>
            {identity.displayName.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Isim */}
            <div style={{
              color: '#e9edef',
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {identity.displayName}
            </div>

            {/* Kimlik bilgisi */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '2px',
            }}>
              <span style={{
                fontSize: '11px',
                color: '#8696a0',
                fontFamily: 'monospace',
                backgroundColor: '#2a3942',
                padding: '1px 4px',
                borderRadius: '3px',
              }}>
                #{identity.id}
              </span>

              {/* Kalan sure */}
              <span style={{
                fontSize: '11px',
                color: isExpiringSoon ? '#ffa94d' : '#8696a0',
              }}>
                {remainingText}
              </span>
            </div>
          </div>

          {/* Ayarlar butonu */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8696a0',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
            }}
          >
            &#9881;
          </button>
        </div>

        {/* Suresi doluyorsa uyari */}
        {isExpiringSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: '8px',
              padding: '6px 8px',
              backgroundColor: '#ffa94d22',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11px', color: '#ffa94d' }}>
              Kimligin suresi dolmak uzere
            </span>
            <button
              onClick={handleRotate}
              style={{
                fontSize: '11px',
                color: '#00a884',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Yenile
            </button>
          </motion.div>
        )}
      </div>

      {/* Ayarlar paneli */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '8px',
              backgroundColor: '#111b21',
              borderRadius: '8px',
              padding: '12px',
            }}>
              <div style={{
                fontSize: '12px',
                color: '#8696a0',
                marginBottom: '10px',
                fontWeight: 500,
              }}>
                Kimlik Ayarlari
              </div>

              {/* TTL secimi */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8696a0', marginBottom: '6px' }}>
                  Kimlik Omru
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {TTL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTtl(opt.value);
                        onUpdateConfig({ ttl: opt.value });
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: ttl === opt.value ? '#00a884' : '#2a3942',
                        color: ttl === opt.value ? '#111b21' : '#e9edef',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: ttl === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonim mod */}
              <button
                onClick={() => {
                  setAnonymous(!anonymous);
                  onUpdateConfig({ anonymous: !anonymous });
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#e9edef',
                }}
              >
                <span style={{ fontSize: '12px' }}>
                  Anonim Mod (isim yerine hash)
                </span>
                <div style={{
                  width: '32px',
                  height: '18px',
                  borderRadius: '9px',
                  backgroundColor: anonymous ? '#00a884' : '#3b4a54',
                  position: 'relative',
                  transition: 'background-color 0.3s',
                }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: anonymous ? '16px' : '2px',
                    transition: 'left 0.3s',
                  }} />
                </div>
              </button>

              {/* Manuel yenile butonu */}
              <button
                onClick={handleRotate}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#2a3942',
                  border: '1px solid #3b4a54',
                  borderRadius: '6px',
                  color: '#e9edef',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                &#128260; Kimligi Simdi Yenile
              </button>

              <p style={{
                marginTop: '8px',
                fontSize: '10px',
                color: '#667781',
                lineHeight: '1.4',
              }}>
                Kimlik yenilendiginde diger peer&apos;ler sizi yeni bir kullanici olarak gorur.
                Eski kimlikle baglanti kurulamaz.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
