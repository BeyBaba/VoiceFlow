"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playRecordStart, playRecordStop, playSuccess, playError, playCopy } from "@/lib/sounds";

type TranscriptionResult = {
  raw: string;
  cleaned: string;
  translated?: string;
  confidence: number;
  language?: string;
  translateTo?: string | null;
  model?: string;
};

const LANGUAGES = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "tr", label: "T\u00FCrk\u00E7e", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "de", label: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "fr", label: "Fran\u00E7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "es", label: "Espa\u00F1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "ja", label: "\u65E5\u672C\u8A9E", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "zh", label: "\u4E2D\u6587", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "pt", label: "Portugu\u00EAs", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "it", label: "Italiano", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", flag: "\u{1F1F8}\u{1F1E6}" },
];

export default function DemoPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [language, setLanguage] = useState("tr");
  const [translateTo, setTranslateTo] = useState("");
  const [duration, setDuration] = useState(0);
  const [history, setHistory] = useState<TranscriptionResult[]>([]);
  const [pillHovered, setPillHovered] = useState(false);
  const [autoCopiedToast, setAutoCopiedToast] = useState(false);
  const lastCopiedTextRef = useRef("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Keep refs in sync with state (for keyboard handler)
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      playRecordStart();
    } catch {
      setError(
        "Mikrofon erişimi reddedildi. Lütfen mikrofon iznini verin."
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, translateTo]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      playRecordStop();
    }
  }, [isRecording]);

  // Ctrl+Space keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        if (isProcessingRef.current) return;
        if (isRecordingRef.current) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startRecording, stopRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);
      if (translateTo && translateTo !== language) {
        formData.append("translateTo", translateTo);
      }

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Transkripsiyon başarısız oldu");
        playError();
        return;
      }

      if (!data.raw && !data.cleaned) {
        setError("Ses algılanamadı. Lütfen tekrar deneyin.");
        playError();
        return;
      }

      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));

      // Auto-copy cleaned text to clipboard
      if (data.cleaned) {
        try {
          await navigator.clipboard.writeText(data.cleaned);
          lastCopiedTextRef.current = data.cleaned;
          playSuccess();
          setAutoCopiedToast(true);
          setTimeout(() => setAutoCopiedToast(false), 3000);
        } catch {
          // clipboard permission denied, ignore
        }
      }
    } catch {
      setError("Ağ hatası. İnternet bağlantınızı kontrol edin.");
      playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    playCopy();
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getLangLabel = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label || code;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-text">VoiceFlow</span>
          </a>
          <span className="text-sm text-text-muted">Web Demo</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">
            Try <span className="gradient-text">VoiceFlow</span>
          </h1>
          <p className="text-text-muted text-lg">
            Mikrofona tıkla, konuş, AI sesini metne dönüştürsün.
          </p>
        </motion.div>

        {/* Language selector - Speaking language */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text mb-2 text-center">
            🎤 Konuşma Dili
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  language === lang.code
                    ? "bg-primary text-white shadow-md"
                    : "bg-stone-100 text-text-muted hover:bg-stone-200"
                }`}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Translate to selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-text mb-2 text-center">
            🌍 Çeviri Dili <span className="font-normal text-text-muted">(opsiyonel)</span>
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setTranslateTo("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                translateTo === ""
                  ? "bg-accent text-white shadow-md"
                  : "bg-stone-100 text-text-muted hover:bg-stone-200"
              }`}
            >
              ❌ Çeviri Yok
            </button>
            {LANGUAGES.filter((l) => l.code !== language).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTranslateTo(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  translateTo === lang.code
                    ? "bg-accent text-white shadow-md"
                    : "bg-stone-100 text-text-muted hover:bg-stone-200"
                }`}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recorder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 p-8 sm:p-12 mb-8"
        >
          {/* Mic button */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 scale-110"
                  : isProcessing
                    ? "bg-stone-300 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark shadow-xl shadow-primary/30 hover:scale-105"
              }`}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              )}
              {isProcessing ? (
                <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isRecording ? (
                <svg className="w-10 h-10 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <div className="mt-4 text-center">
              {isRecording ? (
                <div className="flex items-center gap-2 text-red-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Kaydediliyor... {formatTime(duration)}
                </div>
              ) : isProcessing ? (
                <span className="text-text-muted">
                  AI işliyor...
                  {translateTo && translateTo !== language && " + çeviri yapılıyor..."}
                </span>
              ) : (
                <span className="text-text-muted">Mikrofona tıklayarak başla</span>
              )}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* AI Enhanced result - main output */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        ✨ Metin ({getLangLabel(language)})
                      </span>
                      <span className="text-xs text-text-light ml-2">
                        {result.model}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.cleaned, "cleaned")}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      {copied === "cleaned" ? (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Kopyalandı!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> Kopyala</>
                      )}
                    </button>
                  </div>
                  <p className="text-text text-lg leading-relaxed font-medium">{result.cleaned}</p>
                </div>

                {/* 3. Translation - if requested */}
                {result.translated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-accent/5 border border-accent/20 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                        </svg>
                        <span className="text-xs font-medium text-accent uppercase tracking-wider">
                          Çeviri ({getLangLabel(result.translateTo || translateTo)})
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(result.translated!, "translated")}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                      >
                        {copied === "translated" ? (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Kopyalandı!</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> Kopyala</>
                        )}
                      </button>
                    </div>
                    <p className="text-text text-lg leading-relaxed font-medium">{result.translated}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* History */}
        {history.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Geçmiş</h3>
            <div className="space-y-3">
              {history.slice(1).map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-stone-50 group">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-text flex-1 font-medium">{item.cleaned}</p>
                    <button
                      onClick={() => copyToClipboard(item.cleaned, `history-${i}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-primary shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    </button>
                  </div>
                  {item.translated && (
                    <p className="text-xs text-accent mt-1">{item.translated}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back link */}
        <div className="text-center mt-8 mb-16">
          <a href="/" className="text-sm text-text-muted hover:text-primary transition-colors">
            &larr; Ana sayfaya dön
          </a>
        </div>
      </main>

      {/* Auto-copied toast notification */}
      <AnimatePresence>
        {autoCopiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Panoya kopyalandı!</p>
              <p className="text-xs text-white/70">Herhangi bir yere <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono text-[10px]">Ctrl+V</kbd> ile yapıştır</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bottom pill - large invisible hover zone triggers early */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex items-end justify-center"
        style={{ width: 400, height: 80, paddingBottom: 20 }}
        onMouseEnter={() => setPillHovered(true)}
        onMouseLeave={() => setPillHovered(false)}
      >
        <motion.button
          onClick={isProcessing ? undefined : isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className="relative flex items-center justify-center rounded-full cursor-pointer"
          animate={{
            width: pillHovered || isRecording ? "auto" : 48,
            height: pillHovered || isRecording ? 44 : 6,
            borderRadius: pillHovered || isRecording ? 22 : 3,
            backgroundColor: isRecording
              ? "#ef4444"
              : isProcessing
                ? "#a8a29e"
                : pillHovered
                  ? "#0F766E"
                  : "#292524",
            boxShadow: isRecording
              ? "0 10px 15px -3px rgba(239,68,68,0.4)"
              : pillHovered
                ? "0 10px 15px -3px rgba(15,118,110,0.4)"
                : "0 10px 15px -3px rgba(41,37,36,0.3)",
          }}
          transition={{ type: "spring", stiffness: 700, damping: 35 }}
        >
          <AnimatePresence>
            {(pillHovered || isRecording) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-2 px-5 whitespace-nowrap"
              >
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-white text-sm font-medium">
                      Kaydediliyor... {formatTime(duration)} — Durdurmak için tıkla
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-white text-sm font-medium">
                      Tıkla veya <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">Space</kbd> ile dikte et
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
