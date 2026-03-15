"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  {
    quote: "Parkinson hastasıyım ve artık yazmak benim için çok zor. VoiceFlow sayesinde tekrar üretken oldum. Bu uygulama hayatımı değiştirdi.",
    name: "Hasan Çelik",
    role: "Emekli Öğretmen",
    avatar: "HC",
    color: "bg-rose-500",
    highlight: true,
  },
  {
    quote: "VoiceFlow ile 3 kat daha fazla içerik üretiyorum. Ellerim artık ağrımıyor!",
    name: "Zeynep Yıldız",
    role: "İçerik Üretici",
    avatar: "ZY",
    color: "bg-violet-500",
    highlight: false,
  },
  {
    quote: "RSI sorunu yaşayan bir geliştirici olarak VoiceFlow kariyerimi kurtardı. Ağrısız kod yazabiliyorum.",
    name: "Burak Kaya",
    role: "Kıdemli Geliştirici",
    avatar: "BK",
    color: "bg-blue-500",
    highlight: false,
  },
  {
    quote: "E-posta yanıt sürem %60 düştü. Satış ekibinin tamamı kullanıyor artık.",
    name: "Elif Demir",
    role: "Satış Direktörü",
    avatar: "ED",
    color: "bg-emerald-500",
    highlight: false,
  },
  {
    quote: "Tezimi VoiceFlow ile yazdım, yüzlerce saat tasarruf ettim. AI düzenleme inanılmaz doğru.",
    name: "Mert Arslan",
    role: "Doktora Öğrencisi",
    avatar: "MA",
    color: "bg-orange-500",
    highlight: false,
  },
  {
    quote: "Tüm hukuk ekibimiz VoiceFlow kullanıyor. Belge taslağı hazırlama süresi yarıya indi.",
    name: "Selin Öztürk",
    role: "Avukat, Öztürk Hukuk",
    avatar: "SÖ",
    color: "bg-pink-500",
    highlight: false,
  },
  {
    quote: "İngilizce ve Türkçe arasında sorunsuz geçiş yapıyorum. Çoklu dil desteği kusursuz.",
    name: "Ahmet Yılmaz",
    role: "Ürün Yöneticisi",
    avatar: "AY",
    color: "bg-teal-500",
    highlight: false,
  },
  {
    quote: "Sabah yürüyüşümde bir kitap bölümünün tamamını dikte ettim. Artık her yerde yazabiliyorum.",
    name: "Ayşe Korkmaz",
    role: "Yazar",
    avatar: "AK",
    color: "bg-red-500",
    highlight: false,
  },
  {
    quote: "Yıllardır kullandığım en iyi AI ürünü. Söylediklerimi değil, kastettiğimi anlıyor.",
    name: "Deniz Şahin",
    role: "CEO, TechStart",
    avatar: "DŞ",
    color: "bg-cyan-500",
    highlight: false,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 mb-4">
            Kullanıcı Yorumları
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Binlerce kullanıcı{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              seviyor
            </span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Profesyoneller, öğrenciler ve içerik üreticileri her gün
            VoiceFlow&apos;a güveniyor.
          </p>
        </motion.div>

        {/* Testimonial grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                t.highlight
                  ? "border-teal-500/50 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-stone-900/50 shadow-md shadow-teal-200/30 dark:shadow-teal-900/20 sm:col-span-2 lg:col-span-1"
                  : "border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900/30 hover:shadow-stone-100 dark:hover:shadow-stone-900/50"
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Accessibility badge for highlighted */}
              {t.highlight && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-4">
                  ♿ Erişilebilirlik Hikayesi
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
