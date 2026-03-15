"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const integrations = [
  "Slack",
  "VS Code",
  "Chrome",
  "Gmail",
  "Notion",
  "Figma",
  "GitHub",
  "Discord",
  "Teams",
  "Word",
  "Docs",
  "Zoom",
  "Arc",
  "Obsidian",
  "Linear",
  "Jira",
  "WhatsApp",
  "Telegram",
  "Twitter/X",
  "ChatGPT",
  "Claude",
  "Cursor",
  "Terminal",
  "Excel",
  "Sheets",
  "Trello",
  "Asana",
  "Monday",
  "Webflow",
  "Framer",
];

const row1 = integrations.slice(0, 15);
const row2 = integrations.slice(15, 30);

function IntegrationChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/40 shadow-sm hover:shadow-md dark:hover:shadow-black/20 hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all duration-300 shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-600 flex items-center justify-center text-sm font-bold text-stone-500 dark:text-stone-300">
        {name.charAt(0)}
      </div>
      <span className="text-sm font-medium text-stone-700 dark:text-stone-300 whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export default function Integrations() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="integrations" className="py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-4">
            Entegrasyonlar
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Her yerde{" "}
            <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">çalışır</span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            VoiceFlow, 30+ favori uygulamanızda her metin alanında çalışır.
            Eklenti yok, kurulum yok — sadece konuş.
          </p>
        </motion.div>
      </div>

      {/* Marquee rows - full width */}
      <div className="space-y-4 overflow-hidden">
        {/* Row 1 - left to right */}
        <div className="relative">
          <div className="animate-marquee flex gap-4">
            {[...row1, ...row1].map((name, i) => (
              <IntegrationChip key={`r1-${i}`} name={name} />
            ))}
          </div>
        </div>

        {/* Row 2 - right to left */}
        <div className="relative">
          <div className="animate-marquee-reverse flex gap-4">
            {[...row2, ...row2].map((name, i) => (
              <IntegrationChip key={`r2-${i}`} name={name} />
            ))}
          </div>
        </div>
      </div>

      {/* Count badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm">
            <svg
              className="w-5 h-5 text-teal-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Ve metin alanı olan her uygulama
          </span>
        </motion.div>
      </div>
    </section>
  );
}
