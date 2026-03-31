"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/i18n/context";

const steps = [
  {
    num: "01",
    title: "Ctrl+Space bas",
    desc: "Herhangi bir uygulamada, herhangi bir metin alanında. Windows uygulaması veya Chrome Extension ile çalışır.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: "from-teal-500 to-emerald-600",
  },
  {
    num: "02",
    title: "Doğal konuş",
    desc: "Düşüncelerinizi rahatça söyleyin. \"Şey\", \"hani\", \"yani\" gibi dolgu kelimeler sorun değil — AI hepsini temizler.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    color: "from-blue-500 to-indigo-600",
  },
  {
    num: "03",
    title: "AI düzenler",
    desc: "Groq Whisper AI konuşmanızı anlık olarak metne dönüştürür. Noktalama, büyük harf, dilbilgisi — hepsi otomatik.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    color: "from-violet-500 to-purple-600",
  },
  {
    num: "04",
    title: "Otomatik yapıştır",
    desc: "Temiz metin otomatik olarak panoya kopyalanır ve aktif metin alanına yapıştırılır. Ctrl+V'ye bile gerek yok.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
    color: "from-amber-500 to-orange-600",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            4 adımda <span className="gradient-text">dikte et</span>
          </h2>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Kurulum 30 saniye. Sonra her yerde kullan.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Step number + icon */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-4xl font-black text-stone-100 group-hover:text-primary/10 transition-colors">
                  {step.num}
                </span>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                  {step.icon}
                </div>
              </div>

              <h3 className="text-lg font-bold text-text mb-2">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Connecting line (desktop only) */}
        <div className="hidden lg:flex justify-center mt-8">
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="h-0.5 w-2/3 bg-gradient-to-r from-teal-500 via-indigo-500 to-orange-500 rounded-full origin-left"
          />
        </div>
      </div>
    </section>
  );
}
