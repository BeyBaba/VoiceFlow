"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/i18n/context";

function AnimatedCounter({
  target,
  suffix,
  delay = 0,
}: {
  target: number;
  suffix: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay }}
      >
        {isInView ? target : 0}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

export default function SpeedComparison() {
  const { t } = useI18n();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Marquee background text */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] select-none">
        <div className="animate-marquee whitespace-nowrap text-[200px] font-black leading-none text-stone-900 dark:text-white">
          {t.speedComparison.marquee} &middot; {t.speedComparison.marquee} &middot; {t.speedComparison.marquee} &middot; {t.speedComparison.marquee}
          &middot; {t.speedComparison.marquee} &middot; {t.speedComparison.marquee} &middot; {t.speedComparison.marquee} &middot; {t.speedComparison.marquee}
          &middot;
        </div>
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
            {t.speedComparison.title1}{" "}
            <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">{t.speedComparison.title2}</span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            {t.speedComparison.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Typing */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white dark:bg-stone-900/60 rounded-3xl p-8 border border-stone-200 dark:border-stone-700/50 relative"
          >
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4 uppercase tracking-wider">
              {t.speedComparison.typing}
            </div>
            <div className="text-6xl sm:text-7xl font-black text-stone-300 dark:text-stone-600 mb-2">
              <AnimatedCounter target={45} suffix="" delay={0.3} />
            </div>
            <div className="text-lg text-stone-500 dark:text-stone-400">{t.speedComparison.wpm}</div>
            {/* Progress bar */}
            <div className="mt-8 h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: "20%" } : {}}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-stone-300 dark:bg-stone-600 rounded-full"
              />
            </div>
            {/* Keyboard icon */}
            <div className="absolute top-8 right-8 text-stone-200 dark:text-stone-700">
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v6a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 12V6z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 15.75h9M7.5 9h.008v.008H7.5V9zm3 0h.008v.008H10.5V9zm3 0h.008v.008H13.5V9zm3 0h.008v.008H16.5V9z"
                />
              </svg>
            </div>
          </motion.div>

          {/* VoiceFlow */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-gradient-to-br from-teal-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-teal-500/20"
          >
            {/* Glow effect */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                {t.speedComparison.voiceflow}
              </div>
              <div className="text-6xl sm:text-7xl font-black mb-2">
                <AnimatedCounter target={220} suffix="" delay={0.5} />
              </div>
              <div className="text-lg text-white/70">{t.speedComparison.wpm}</div>
              {/* Progress bar */}
              <div className="mt-8 h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "100%" } : {}}
                  transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                  className="h-full bg-white/40 rounded-full"
                />
              </div>
              {/* Mic icon */}
              <div className="absolute top-0 right-0 text-white/20">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4x badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8, type: "spring" }}
          className="flex justify-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold text-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            {t.speedComparison.faster}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
