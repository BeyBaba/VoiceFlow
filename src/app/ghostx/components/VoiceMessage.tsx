'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createBlobUrl, revokeBlobUrl } from '@/lib/ghostx/media-chunker';

interface Props {
  data: Uint8Array;
  mimeType: string;
  duration: number;
  waveform: number[];
  isOwn: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Ses mesaji oynatici component
 * Ses RAM'den oynatilir, diske yazilmaz
 * WhatsApp tarzi dalga formu gorunumu
 */
export default function VoiceMessage({ data, mimeType, duration, waveform, isOwn }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Blob URL olustur
  useEffect(() => {
    const url = createBlobUrl(data, mimeType);
    setBlobUrl(url);
    return () => {
      revokeBlobUrl(url);
      setBlobUrl(null);
    };
  }, [data, mimeType]);

  // Oynatma durumu takip
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setPlaybackProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [blobUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Dalga formu normalizasyonu
  const normalizedWaveform = waveform.length > 0
    ? waveform
    : Array.from({ length: 40 }, () => Math.random() * 50 + 10);

  const maxVal = Math.max(...normalizedWaveform, 1);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 0',
      minWidth: '240px',
    }}>
      {/* Gizli audio element */}
      {blobUrl && (
        <audio ref={audioRef} src={blobUrl} preload="auto" />
      )}

      {/* Play/Pause butonu */}
      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.85 }}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          backgroundColor: isOwn ? '#00a884' : '#00a884',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isPlaying ? (
          // Pause ikonu
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#111b21">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          // Play ikonu
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#111b21">
            <path d="M3 1.5L12 7L3 12.5V1.5Z" />
          </svg>
        )}
      </motion.button>

      {/* Dalga formu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          height: '28px',
        }}>
          {normalizedWaveform.slice(0, 50).map((val, i) => {
            const progress = i / normalizedWaveform.length;
            const isPast = progress <= playbackProgress;

            return (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${Math.max((val / maxVal) * 24, 3)}px`,
                  backgroundColor: isPast
                    ? (isOwn ? '#b3f0e0' : '#00a884')
                    : (isOwn ? '#ffffff40' : '#ffffff30'),
                  borderRadius: '2px',
                  transition: 'background-color 0.1s',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        {/* Sure */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: isOwn ? '#ffffff80' : '#8696a0',
        }}>
          <span>
            {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
