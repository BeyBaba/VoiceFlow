"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

const phrases = [
  {
    spoken: "şey aslında ben diyorum ki hani bu projeyi yani bitirmemiz lazım işte bu hafta içinde",
    clean: "Bu projeyi bu hafta içinde bitirmemiz lazım.",
  },
  {
    spoken: "um so basically I think we should uh move the meeting to next Tuesday if that works",
    clean: "I think we should move the meeting to next Tuesday if that works.",
  },
  {
    spoken: "hey uh can you like send me the report um the quarterly one from last month yeah",
    clean: "Can you send me the quarterly report from last month?",
  },
  {
    spoken: "also ich denke ähm wir sollten das Meeting äh auf Dienstag verschieben wenn das geht",
    clean: "Ich denke, wir sollten das Meeting auf Dienstag verschieben.",
  },
];

export default function Hero() {
  const { t } = useI18n();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showClean, setShowClean] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    const target = showClean ? phrase.clean : phrase.spoken;

    if (charIndex < target.length) {
      const timer = setTimeout(() => {
        setDisplayText(target.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, showClean ? 18 : 22);
      return () => clearTimeout(timer);
    }

    const nextTimer = setTimeout(() => {
      if (!showClean) {
        setShowClean(true);
        setCharIndex(0);
        setDisplayText("");
      } else {
        setShowClean(false);
        setCharIndex(0);
        setDisplayText("");
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, showClean ? 2200 : 800);
    return () => clearTimeout(nextTimer);
  }, [charIndex, phraseIndex, showClean]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-teal-500/5 to-transparent rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
          </span>
          {t.hero.badge}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.1]"
        >
          {t.hero.headline1}
          <br />
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {t.hero.headline2}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-stone-400 dark:text-stone-400 max-w-2xl mx-auto mb-12"
        >
          {t.hero.subtitle}{" "}
          <span className="text-teal-400 font-semibold">{t.hero.subtitle4x}</span>.{" "}
          {t.hero.subtitleEnd}
        </motion.p>

        {/* Live demo box */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="rounded-2xl shadow-2xl shadow-black/20 border border-stone-700/50 overflow-hidden bg-stone-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-700/50 bg-stone-800/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 text-center">
                <span className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-300 ${
                  showClean
                    ? "bg-teal-500/20 text-teal-300"
                    : "bg-stone-700/50 text-stone-400"
                }`}>
                  {showClean ? `✨ ${t.hero.aiEnhanced}` : `🎤 ${t.hero.rawVoice}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${!showClean ? "bg-red-500 animate-pulse" : "bg-teal-500"}`} />
                <span className="text-xs text-stone-400">
                  {!showClean ? t.hero.recording : t.hero.done}
                </span>
              </div>
            </div>
            <div className="p-6 sm:p-8 min-h-[120px] flex items-center">
              <p className={`text-left text-base sm:text-lg leading-relaxed transition-colors duration-300 ${
                showClean ? "text-white font-medium" : "text-stone-500"
              }`}>
                {showClean && <span className="text-teal-400 mr-1">✨</span>}
                {displayText}
                <span className="animate-blink text-teal-400 font-light">|</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <a
            href="/api/download"
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold text-lg hover:from-teal-500 hover:to-teal-400 transition-all shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t.hero.downloadWindows}
            <span className="text-xs opacity-70 font-normal ml-1">{t.hero.free}</span>
          </a>

          <a
            href="/demo"
            className="px-8 py-4 rounded-2xl border-2 border-stone-600 text-stone-200 font-semibold text-lg hover:border-teal-500 hover:text-teal-400 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            {t.hero.webDemo}
          </a>

          <a
            href="/VoiceFlow.Chrome.Extension.zip"
            download="VoiceFlow.Chrome.Extension.zip"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            {t.hero.chromeExtension}
          </a>
        </motion.div>

        {/* Platform badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center justify-center gap-6 text-stone-500"
        >
          {[
            { name: t.hero.windows, icon: "💻" },
            { name: t.hero.chrome, icon: "🌐" },
            { name: t.hero.webApp, icon: "🎤" },
            { name: t.hero.languages, icon: "🌍" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-1.5 text-sm font-medium">
              <span>{p.icon}</span>
              {p.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
