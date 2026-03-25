'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TorState {
  isEnabled: boolean;
  isConnecting: boolean;
  isAvailable: boolean;  // Tor binary mevcut mu?
  error: string | null;
}

/**
 * Tor durumu ve kontrol panel
 * Sidebar'da veya ayarlarda gosterilir
 */
export default function TorStatus() {
  const [tor, setTor] = useState<TorState>({
    isEnabled: false,
    isConnecting: false,
    isAvailable: typeof window !== 'undefined' && 'ghostx' in window,
    error: null,
  });

  const [showDetails, setShowDetails] = useState(false);

  const toggleTor = useCallback(async () => {
    // Electron ortaminda mi?
    if (typeof window === 'undefined' || !('ghostx' in window)) {
      setTor(prev => ({
        ...prev,
        error: 'Tor sadece Desktop (Electron) versiyonunda kullanilabilir. Web icin Tor Browser kullanin.',
      }));
      return;
    }

    if (tor.isEnabled) {
      // Tor'u kapat
      try {
        const ghostx = window as unknown as { ghostx: { disableTor: () => Promise<{ success: boolean; error?: string }> } };
        const result = await ghostx.ghostx.disableTor();
        if (result.success) {
          setTor(prev => ({ ...prev, isEnabled: false, error: null }));
        }
      } catch {
        setTor(prev => ({ ...prev, error: 'Tor kapatma hatasi' }));
      }
    } else {
      // Tor'u baslat
      setTor(prev => ({ ...prev, isConnecting: true, error: null }));

      try {
        const ghostx = window as unknown as { ghostx: { enableTor: () => Promise<{ success: boolean; port?: number; error?: string }> } };
        const result = await ghostx.ghostx.enableTor();

        if (result.success) {
          setTor(prev => ({ ...prev, isEnabled: true, isConnecting: false, error: null }));
        } else {
          setTor(prev => ({
            ...prev,
            isConnecting: false,
            error: result.error || 'Tor baglantisi basarisiz',
          }));
        }
      } catch {
        setTor(prev => ({ ...prev, isConnecting: false, error: 'Tor baslatma hatasi' }));
      }
    }
  }, [tor.isEnabled]);

  const requestNewCircuit = useCallback(async () => {
    if (!tor.isEnabled) return;

    try {
      const ghostx = window as unknown as { ghostx: { newTorCircuit: () => Promise<{ success: boolean }> } };
      await ghostx.ghostx.newTorCircuit();
    } catch {
      // Sessizce gec
    }
  }, [tor.isEnabled]);

  return (
    <div style={{ padding: '8px 16px' }}>
      {/* Tor Toggle */}
      <button
        onClick={toggleTor}
        disabled={tor.isConnecting}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          backgroundColor: tor.isEnabled ? '#005c4b33' : '#2a3942',
          border: tor.isEnabled ? '1px solid #005c4b' : '1px solid transparent',
          borderRadius: '8px',
          cursor: tor.isConnecting ? 'wait' : 'pointer',
          color: '#e9edef',
          fontSize: '13px',
          textAlign: 'left',
        }}
      >
        {/* Tor ikonu */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: tor.isEnabled ? '#00a884' : tor.isConnecting ? '#ffa94d' : '#3b4a54',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
          transition: 'background-color 0.3s',
        }}>
          {tor.isConnecting ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block' }}
            >
              &#9696;
            </motion.span>
          ) : (
            <span>{tor.isEnabled ? '&#128737;' : '&#127760;'}</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>
            {tor.isConnecting ? 'Tor Baglaniyor...' : tor.isEnabled ? 'Tor Aktif' : 'Tor Kapali'}
          </div>
          <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '2px' }}>
            {tor.isEnabled
              ? 'IP adresiniz gizli'
              : tor.isConnecting
                ? 'Tor agina baglaniliyor...'
                : 'IP adresiniz gorunur'
            }
          </div>
        </div>

        {/* Toggle switch gorunumu */}
        <div style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          backgroundColor: tor.isEnabled ? '#00a884' : '#3b4a54',
          position: 'relative',
          transition: 'background-color 0.3s',
          flexShrink: 0,
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: '2px',
            left: tor.isEnabled ? '18px' : '2px',
            transition: 'left 0.3s',
          }} />
        </div>
      </button>

      {/* Hata mesaji */}
      <AnimatePresence>
        {tor.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#ff6b6b22',
              borderRadius: '6px',
              color: '#ff6b6b',
              fontSize: '12px',
            }}
          >
            {tor.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detaylar */}
      {tor.isEnabled && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8696a0',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            {showDetails ? 'Detaylari gizle' : 'Detaylari goster'}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#111b21',
                  borderRadius: '6px',
                  marginTop: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8696a0', fontSize: '12px' }}>Protokol</span>
                    <span style={{ color: '#e9edef', fontSize: '12px' }}>SOCKS5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#8696a0', fontSize: '12px' }}>Durum</span>
                    <span style={{ color: '#00a884', fontSize: '12px' }}>Bagli</span>
                  </div>

                  {/* Yeni devre (IP degistir) */}
                  <button
                    onClick={requestNewCircuit}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#2a3942',
                      border: '1px solid #3b4a54',
                      borderRadius: '4px',
                      color: '#e9edef',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    &#128260; Yeni IP Al (Devre Degistir)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
