"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const companyLogos = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Netflix",
  "Spotify",
  "Uber",
  "Airbnb",
  "Stripe",
  "Vercel",
  "OpenAI",
  "Nvidia",
  "Adobe",
  "Shopify",
];

const testimonials = [
  {
    quote:
      "VoiceFlow ile 3 kat daha fazla içerik üretiyorum. Ellerim artık ağrımıyor!",
    name: "Zeynep Yıldız",
    role: "İçerik Üretici",
    avatar: "ZY",
    color: "bg-violet-500",
  },
  {
    quote:
      "RSI sorunu yaşayan bir geliştirici olarak VoiceFlow kariyerimi kurtardı. Ağrısız kod yazabiliyorum.",
    name: "Burak Kaya",
    role: "Kıdemli Geliştirici",
    avatar: "BK",
    color: "bg-blue-500",
  },
  {
    quote:
      "E-posta yanıt sürem %60 düştü. Hayat kurtaran bir araç.",
    name: "Elif Demir",
    role: "Satış Direktörü",
    avatar: "ED",
    color: "bg-emerald-500",
  },
  {
    quote:
      "Tezimi VoiceFlow ile yazmak yüzlerce saat tasarruf ettirdi. AI düzenleme inanılmaz.",
    name: "Mert Arslan",
    role: "Doktora Öğrencisi",
    avatar: "MA",
    color: "bg-orange-500",
  },
  {
    quote:
      "Tüm hukuk ekibimiz VoiceFlow kullanıyor. Belge taslağı hazırlama süresi yarıya indi.",
    name: "Selin Öztürk",
    role: "Avukat, Öztürk Hukuk",
    avatar: "SÖ",
    color: "bg-pink-500",
  },
  {
    quote:
      "Çoklu dil desteği mükemmel. İngilizce ve Türkçe arasında sorunsuz geçiş yapıyorum.",
    name: "Ahmet Yılmaz",
    role: "Ürün Yöneticisi",
    avatar: "AY",
    color: "bg-teal-500",
  },
  {
    quote:
      "Sabah yürüyüşümde bir kitap bölümünün tamamını dikte ettim. İmkansızı mümkün kılıyor.",
    name: "Ayşe Korkmaz",
    role: "Yazar",
    avatar: "AK",
    color: "bg-red-500",
  },
  {
    quote:
      "Müşteri destek biletleri 2 kat daha hızlı çözülüyor. Ekip genelinde benimsedik.",
    name: "Serkan Aydın",
    role: "Destek Müdürü",
    avatar: "SA",
    color: "bg-indigo-500",
  },
  {
    quote:
      "Yıllardır kullandığım en iyi AI ürünü. Söylediklerimi değil, kastettiğimi anlıyor.",
    name: "Deniz Şahin",
    role: "CEO, TechStart",
    avatar: "DŞ",
    color: "bg-cyan-500",
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
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Binlerce kullanıcı{" "}
            <span className="gradient-text">seviyor</span>
          </h2>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Profesyoneller, öğrenciler ve içerik üreticileri her gün
            VoiceFlow&apos;a güveniyor.
          </p>
        </motion.div>

        {/* Company logos marquee */}
        <div className="overflow-hidden mb-16">
          <div className="animate-marquee-slow flex items-center gap-12">
            {[...companyLogos, ...companyLogos].map((logo, i) => (
              <span
                key={`logo-${i}`}
                className="text-xl sm:text-2xl font-bold text-stone-300 whitespace-nowrap select-none"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-lg hover:shadow-stone-100 transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className="w-4 h-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-text-muted leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">
                    {t.name}
                  </div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
