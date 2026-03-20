"use client";
import { motion } from "framer-motion";

const rows = [
  { label: "Aylık Fiyat", us: "$8/ay", them: "$15/ay", win: true },
  { label: "Lifetime Seçenek", us: "$149 tek sefer", them: "Yok", win: true },
  { label: "Ücretsiz Plan", us: "2.000 kelime/gün", them: "2.000 kelime/hafta", win: true },
  { label: "RAM Kullanımı", us: "~150 MB", them: "~800 MB", win: true },
  { label: "Açılış Süresi", us: "~2 saniye", them: "~8-10 saniye", win: true },
  { label: "Gizlilik", us: "Lokal API Key", them: "Bulut (3. taraf)", win: true },
  { label: "Veri Saklama", us: "Hiçbir şey saklanmaz", them: "Bulutta işlenir", win: true },
  { label: "Dil Desteği", us: "12+ Dil", them: "100+ Dil", win: false },
  { label: "AI Düzenleme", us: "✓", them: "✓", win: null },
  { label: "Otomatik Yapıştırma", us: "✓", them: "✓", win: null },
  { label: "Platform", us: "Windows + Chrome", them: "Mac/Win/iOS/Android", win: false },
];

export default function Comparison() {
  return (
    <section id="comparison" className="relative py-24 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 mb-4">
            Karşılaştırma
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Neden{" "}
            <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
              VoiceFlow
            </span>
            ?
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Aynı işi yarı fiyata, daha hızlı ve daha güvenli yapıyoruz.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border border-stone-200 dark:border-stone-700/50 overflow-hidden shadow-xl bg-white dark:bg-stone-900/50"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700/50">
            <div className="p-4 text-sm font-semibold text-stone-500 dark:text-stone-400">
              Özellik
            </div>
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white text-sm font-bold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
                VoiceFlow
              </div>
            </div>
            <div className="p-4 text-center text-sm font-semibold text-stone-500 dark:text-stone-400">
              Diğerleri
            </div>
          </div>

          {/* Table Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={`grid grid-cols-3 border-b last:border-b-0 border-stone-100 dark:border-stone-800/50 ${
                row.win === true ? "bg-teal-50/30 dark:bg-teal-950/10" : ""
              }`}
            >
              <div className="p-4 text-sm font-medium text-stone-700 dark:text-stone-300 flex items-center">
                {row.label}
              </div>
              <div className="p-4 text-center text-sm font-semibold flex items-center justify-center gap-1.5">
                <span className={row.win === true ? "text-teal-600 dark:text-teal-400" : "text-stone-700 dark:text-stone-300"}>
                  {row.us}
                </span>
                {row.win === true && (
                  <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400 flex items-center justify-center">
                {row.them}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
            Daha az ödeyip daha fazlasını al.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all hover:-translate-y-0.5"
          >
            Planları Gör
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
