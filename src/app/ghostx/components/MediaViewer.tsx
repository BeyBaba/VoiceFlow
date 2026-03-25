'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBlobUrl, revokeBlobUrl } from '@/lib/ghostx/media-chunker';

interface Props {
  data: Uint8Array;
  mimeType: string;
  fileName?: string;
  onClose: () => void;
}

/**
 * Sifreli medya goruntuleyici
 * Medya RAM'den gosterilir, diske ASLA yazilmaz
 * Component unmount olunca Blob URL serbest birakilir
 */
export default function MediaViewer({ data, mimeType, fileName, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');

  // Blob URL olustur (RAM'den)
  useEffect(() => {
    const url = createBlobUrl(data, mimeType);
    setBlobUrl(url);

    // Temizlik: Component unmount olunca URL serbest birak
    return () => {
      revokeBlobUrl(url);
      setBlobUrl(null);
    };
  }, [data, mimeType]);

  // ESC ile kapat
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!blobUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          cursor: 'pointer',
        }}
      >
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        }}>
          <span style={{ color: '#e9edef', fontSize: '14px' }}>
            {fileName || (isImage ? 'Fotograf' : isVideo ? 'Video' : 'Medya')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e9edef',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            &#10005;
          </button>
        </div>

        {/* Icerik */}
        <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh' }}>
          {isImage && (
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={blobUrl}
              alt="Sifreli fotograf"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                // Sag tik korumasi
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {isVideo && (
            <motion.video
              ref={videoRef}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={blobUrl}
              controls
              autoPlay
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '8px',
              }}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />
          )}

          {isAudio && (
            <div style={{
              backgroundColor: '#202c33',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '300px',
            }}>
              <div style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                &#127925;
              </div>
              <audio
                src={blobUrl}
                controls
                autoPlay
                style={{ width: '100%' }}
                controlsList="nodownload"
              />
            </div>
          )}
        </div>

        {/* Guvenlik notu */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#8696a0',
          fontSize: '12px',
        }}>
          <span>&#128274;</span>
          <span>Bu medya RAM&apos;den gosteriliyor. Kapatildiginda silinecek.</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
