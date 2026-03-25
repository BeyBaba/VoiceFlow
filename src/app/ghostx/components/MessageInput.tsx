'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useGhostX } from './GhostXProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceRecorder } from '@/lib/ghostx/voice-message';

// Kaybolan mesaj sureleri
const DISAPPEAR_OPTIONS = [
  { label: 'Kapali', value: 0 },
  { label: '5 saniye', value: 5000 },
  { label: '30 saniye', value: 30000 },
  { label: '1 dakika', value: 60000 },
  { label: '5 dakika', value: 300000 },
];

export default function MessageInput() {
  const { sendMessage, sendMediaMessage, state } = useGhostX();
  const [text, setText] = useState('');
  const [disappearAfter, setDisappearAfter] = useState(0);
  const [showDisappearMenu, setShowDisappearMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !state.currentRoom) return;

    sendMessage(trimmed, disappearAfter || undefined);
    setText('');

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
    const el = e.target;
    el.style.height = '20px';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // === Dosya Gonderimi (Fotograf/Video) ===
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosyayi RAM'e oku
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Medya mesaji gonder
    if (sendMediaMessage) {
      sendMediaMessage(data, file.type, file.name, disappearAfter || undefined);
    }

    // Input'u sifirla
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [sendMediaMessage, disappearAfter]);

  // === Ses Kaydi ===
  const startRecording = useCallback(async () => {
    try {
      const recorder = new VoiceRecorder();
      voiceRecorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Sureyi guncelle
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch {
      alert('Mikrofon erisimi reddedildi');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!voiceRecorderRef.current) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      const recording = await voiceRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);

      // Ses mesajini gonder
      if (sendMediaMessage) {
        sendMediaMessage(
          recording.data,
          recording.mimeType,
          `voice-${Date.now()}.webm`,
          disappearAfter || undefined
        );
      }
    } catch {
      setIsRecording(false);
    }

    voiceRecorderRef.current = null;
  }, [sendMediaMessage, disappearAfter]);

  const cancelRecording = useCallback(() => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.cancel();
      voiceRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  if (!state.currentRoom) return null;

  const activeDisappear = DISAPPEAR_OPTIONS.find(o => o.value === disappearAfter);

  // Ses kaydi modu
  if (isRecording) {
    return (
      <div style={{
        backgroundColor: '#202c33',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #222d34',
      }}>
        {/* Iptal */}
        <motion.button
          onClick={cancelRecording}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '6px',
          }}
        >
          &#128465;
        </motion.button>

        {/* Kayit gostergesi */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ff0000',
            }}
          />
          <span style={{ color: '#e9edef', fontSize: '14px', fontFamily: 'monospace' }}>
            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
          </span>
          <span style={{ color: '#8696a0', fontSize: '13px' }}>
            Ses kaydediliyor...
          </span>
        </div>

        {/* Gonder */}
        <motion.button
          onClick={stopRecording}
          whileTap={{ scale: 0.9 }}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#111b21">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
          </svg>
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#202c33',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      borderTop: '1px solid #222d34',
    }}>
      {/* Gizli dosya input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

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

      {/* Dosya ekleme butonu */}
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Fotograf veya video gonder"
        style={{
          background: 'none',
          border: 'none',
          color: '#8696a0',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        &#128206;
      </button>

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

      {/* Gonder veya Ses Kaydi butonu */}
      {text.trim() ? (
        <motion.button
          onClick={handleSend}
          whileTap={{ scale: 0.9 }}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#00a884',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#111b21">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
          </svg>
        </motion.button>
      ) : (
        <motion.button
          onClick={startRecording}
          whileTap={{ scale: 0.9 }}
          title="Ses mesaji kaydet"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#3b4a54',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* Mikrofon ikonu */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#8696a0">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </motion.button>
      )}
    </div>
  );
}
