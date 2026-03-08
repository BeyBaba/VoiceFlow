"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const useCases = [
  {
    id: "developers",
    label: "Geliştiriciler",
    icon: "💻",
    title: "Sesinizle daha hızlı kod yazın",
    description:
      "Kod yorumları, dokümantasyon, commit mesajları ve hatta pseudocode dikte edin. VoiceFlow teknik jargonu anlar ve mükemmel biçimlendirir.",
    stats: "Günde 2+ saat tasarruf",
    color: "from-blue-500/10 to-indigo-500/10",
  },
  {
    id: "students",
    label: "Öğrenciler",
    icon: "🎓",
    title: "Düşünce hızında ödev yazın",
    description:
      "Ders notlarını, fikirleri ve çalışma notlarını anında cilalı metne dönüştürün. Akademik formatlama dahil.",
    stats: "3 kat hızlı ödev yazma",
    color: "from-green-500/10 to-emerald-500/10",
  },
  {
    id: "creators",
    label: "İçerik Üreticileri",
    icon: "🎨",
    title: "Fikirleri kaybolmadan yakalayın",
    description:
      "Blog yazıları, senaryolar, sosyal medya içerikleri — aklınızdakileri söyleyin, AI düzeltsin. Yavaş yazmaya fikirleri feda etmeyin.",
    stats: "10 kat daha fazla içerik",
    color: "from-purple-500/10 to-pink-500/10",
  },
  {
    id: "sales",
    label: "Satış",
    icon: "📈",
    title: "Müşterilere saniyeler içinde yanıt verin",
    description:
      "Kişiselleştirilmiş takipler, CRM notları ve teklifler — hepsi sesle. Rakipleriniz yazarken siz çoktan cevap vermiş olun.",
    stats: "%50 daha hızlı yanıt",
    color: "from-orange-500/10 to-red-500/10",
  },
  {
    id: "accessibility",
    label: "Erişilebilirlik",
    icon: "♿",
    title: "Klavyesiz yazın",
    description:
      "RSI, motor engeller veya yazma güçlüğü çekenler için. VoiceFlow tüm uygulamalarda tam klavyesiz bilgisayar kullanımı sağlar.",
    stats: "%100 klavyesiz iş akışı",
    color: "from-teal-500/10 to-cyan-500/10",
  },
  {
    id: "lawyers",
    label: "Avukatlar",
    icon: "⚖️",
    title: "Hukuki belgeleri zahmetsizce hazırlayın",
    description:
      "Sözleşmeleri, dilekçeleri ve dava notlarını hassasiyetle dikte edin. VoiceFlow hukuki terminolojiyi öğrenir.",
    stats: "4 kat hızlı belge hazırlama",
    color: "from-amber-500/10 to-yellow-500/10",
  },
  {
    id: "support",
    label: "Destek",
    icon: "🎧",
    title: "Destek taleplerini ışık hızında çözün",
    description:
      "Müşteri yanıtları, dahili notlar ve eskalasyon özetleri sesle. Aynı ekiple 2 kat daha fazla talep çözün.",
    stats: "2 kat talep çözüm oranı",
    color: "from-rose-500/10 to-pink-500/10",
  },
  {
    id: "leaders",
    label: "Yöneticiler",
    icon: "👔",
    title: "Her yerden yönetin",
    description:
      "Slack mesajları, e-postalar ve toplantı notları — hepsi eller serbest. Hareket halindeki liderler için mükemmel.",
    stats: "Günde 90 dakika tasarruf",
    color: "from-sky-500/10 to-blue-500/10",
  },
];

export default function UseCases() {
  const [active, setActive] = useState(useCases[0].id);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const activeCase = useCases.find((u) => u.id === active)!;

  return (
    <section id="usecases" className="py-24 sm:py-32 bg-white">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Herkes için{" "}
            <span className="gradient-text">tasarlandı</span>
          </h2>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            İster kod yazın, ister içerik üretin, ister satış yapın —
            VoiceFlow iş akışınıza uyum sağlar.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActive(uc.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                active === uc.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-stone-100 text-text-muted hover:bg-stone-200"
              }`}
            >
              <span className="mr-1.5">{uc.icon}</span>
              {uc.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`bg-gradient-to-br ${activeCase.color} rounded-3xl p-8 sm:p-12 border border-stone-100`}
          >
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-5xl mb-6">{activeCase.icon}</div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                {activeCase.title}
              </h3>
              <p className="text-text-muted text-lg mb-8 leading-relaxed">
                {activeCase.description}
              </p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 text-primary font-semibold text-sm">
                <svg
                  className="w-5 h-5"
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
                {activeCase.stats}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
