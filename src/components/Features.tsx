"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const features = [
  {
    id: "ai-edit",
    title: "AI Otomatik Düzenleme",
    subtitle: "Konuş, AI düzeltsin",
    description:
      "VoiceFlow \"şey\", \"hani\", \"yani\" gibi dolgu kelimeleri otomatik temizler. Noktalama, büyük harf, dilbilgisi — hepsi AI tarafından düzenlenir.",
    demo: {
      before:
        "şey hani ben düşünüyorum ki yani bu projeyi ee ileri taşımalıyız",
      after: "Ben düşünüyorum ki bu projeyi ileri taşımalıyız.",
    },
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-500/10",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "everywhere",
    title: "Her Yerde Çalışır",
    subtitle: "Tüm uygulamalarda",
    description:
      "Gmail, Slack, Word, VS Code, WhatsApp, ChatGPT... Herhangi bir metin alanında Ctrl+Space bas ve konuş. Ayrı kurulum gerekmez.",
    apps: ["Gmail", "Slack", "VS Code", "Word", "WhatsApp", "ChatGPT", "Notion", "Discord"],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M12 3.75v16.5" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "speed",
    title: "Anında Transkripsiyon",
    subtitle: "Groq Whisper AI",
    description:
      "Groq'un ultra-hızlı Whisper Large v3 modeli ile konuşmanız saniyeler içinde metne dönüşür. Ortalama yanıt süresi 0.5 saniye.",
    stats: [
      { label: "Yanıt süresi", value: "< 0.5s" },
      { label: "Doğruluk", value: "%97+" },
      { label: "Desteklenen dil", value: "12+" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "command-mode",
    title: "Komut Modu",
    subtitle: "Sesli komutlarla yönet",
    description:
      "\"Bunu resmi yap\", \"İngilizce'ye çevir\", \"Kısalt\" gibi sesli komutlarla metninizi anında dönüştürün. AI, ne istediğinizi anlar ve uygular.",
    commands: [
      { cmd: "Bunu resmi yap", result: "Ton: Profesyonel" },
      { cmd: "İngilizce'ye çevir", result: "Dil: EN → TR" },
      { cmd: "Kısalt", result: "Özetle: %50" },
      { cmd: "Madde listesi yap", result: "Format: Bullet" },
    ],
    pro: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    gradient: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50 dark:bg-indigo-500/10",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "multilang",
    title: "Çoklu Dil Desteği",
    subtitle: "12+ dil, sıfır ayar",
    description:
      "Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Japonca ve daha fazlası. Diller arası geçiş yapmak için sadece ayarlardan dil seçin.",
    flags: [
      { emoji: "🇹🇷", name: "Türkçe" },
      { emoji: "🇺🇸", name: "English" },
      { emoji: "🇩🇪", name: "Deutsch" },
      { emoji: "🇫🇷", name: "Français" },
      { emoji: "🇪🇸", name: "Español" },
      { emoji: "🇯🇵", name: "日本語" },
      { emoji: "🇰🇷", name: "한국어" },
      { emoji: "🇨🇳", name: "中文" },
      { emoji: "🇧🇷", name: "Português" },
      { emoji: "🇮🇹", name: "Italiano" },
      { emoji: "🇷🇺", name: "Русский" },
      { emoji: "🇸🇦", name: "العربية" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "privacy",
    title: "Gizlilik Odaklı",
    subtitle: "Verileriniz sizde kalır",
    description:
      "Ses kayıtlarınız sadece transkripsiyon için kullanılır ve saklanmaz. API anahtarınız cihazınızda şifreli tutulur. Sunucu tarafında veri depolamaz.",
    badges: ["Ses kaydı saklanmaz", "Uçtan uca şifreleme", "Yerel API key", "GDPR uyumlu"],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    gradient: "from-teal-500 to-cyan-600",
    bgLight: "bg-teal-50 dark:bg-teal-500/10",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "auto-paste",
    title: "Otomatik Yapıştırma",
    subtitle: "Ctrl+V'ye bile gerek yok",
    description:
      "Transkripsiyon tamamlandığında metin otomatik olarak panoya kopyalanır ve aktif metin alanına yapıştırılır. Çift tıklama ile de yapıştırabilirsiniz.",
    flow: [
      { step: "Konuş", icon: "🎤" },
      { step: "AI düzenler", icon: "✨" },
      { step: "Otomatik yapıştır", icon: "📋" },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
    gradient: "from-pink-500 to-rose-600",
    bgLight: "bg-pink-50 dark:bg-pink-500/10",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  {
    id: "snippets",
    title: "Snippet Kütüphanesi",
    subtitle: "Hazır şablonlar",
    description:
      "Sık kullandığınız cümleleri, e-posta şablonlarını ve imzaları kaydedin. Sesle çağırın, anında yapıştırın. Tekrar tekrar yazmaya son.",
    snippets: [
      { name: "E-posta Kapanış", text: "Saygılarımla, iyi çalışmalar dilerim." },
      { name: "Toplantı Daveti", text: "Yarınki toplantıya katılabilir misiniz?" },
      { name: "Teşekkür", text: "İlginiz için teşekkür ederim." },
    ],
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
    bgLight: "bg-cyan-50 dark:bg-cyan-500/10",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
];

function FeatureCard({
  feature,
  index,
  isActive,
  onClick,
}: {
  feature: (typeof features)[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={onClick}
      className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-500 bg-white dark:bg-stone-900/60 ${
        isActive
          ? "border-primary dark:border-teal-500/50 shadow-xl shadow-primary/10 dark:shadow-teal-500/5 ring-1 ring-primary/20 dark:ring-teal-500/20"
          : "border-stone-200 dark:border-stone-700/50 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-black/20 hover:border-stone-300 dark:hover:border-stone-600"
      }`}
    >
      <div className="p-6">
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shrink-0 shadow-lg`}
          >
            {feature.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">{feature.title}</h3>
              {feature.pro && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  Pro
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">{feature.subtitle}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
          {feature.description}
        </p>

        {/* Feature-specific content */}
        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* AI Edit Demo */}
              {feature.demo && (
                <div className="space-y-2 mt-2">
                  <div className={`rounded-lg p-3 bg-red-50 dark:bg-red-500/10`}>
                    <div className="text-[10px] font-semibold text-red-400 mb-1 uppercase tracking-widest">
                      Ham giriş
                    </div>
                    <p className="text-xs text-red-500/70 dark:text-red-400/60 line-through leading-relaxed">
                      {feature.demo.before}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-green-50 dark:bg-green-500/10">
                    <div className="text-[10px] font-semibold text-green-500 dark:text-green-400 mb-1 uppercase tracking-widest">
                      AI çıktısı
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium leading-relaxed">
                      {feature.demo.after}
                    </p>
                  </div>
                </div>
              )}

              {/* Apps grid */}
              {feature.apps && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {feature.apps.map((app, i) => (
                    <motion.span
                      key={app}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`px-2.5 py-1 rounded-md ${feature.bgLight} text-xs font-medium ${feature.textColor}`}
                    >
                      {app}
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Stats */}
              {feature.stats && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {feature.stats.map((stat) => (
                    <div key={stat.label} className={`${feature.bgLight} rounded-lg p-2.5 text-center`}>
                      <div className={`text-lg font-black ${feature.textColor}`}>{stat.value}</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Command Mode - Commands */}
              {feature.commands && (
                <div className="space-y-1.5 mt-2">
                  {feature.commands.map((cmd, i) => (
                    <motion.div
                      key={cmd.cmd}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center justify-between rounded-lg p-2.5 ${feature.bgLight}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🎤</span>
                        <span className={`text-xs font-medium ${feature.textColor}`}>
                          &ldquo;{cmd.cmd}&rdquo;
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono bg-white/50 dark:bg-white/5 px-2 py-0.5 rounded">
                        {cmd.result}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Flags */}
              {feature.flags && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {feature.flags.map((flag, i) => (
                    <motion.div
                      key={flag.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md ${feature.bgLight}`}
                    >
                      <span className="text-sm">{flag.emoji}</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium truncate">{flag.name}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Privacy badges */}
              {feature.badges && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {feature.badges.map((badge, i) => (
                    <motion.span
                      key={badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${feature.bgLight} text-xs font-medium ${feature.textColor}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {badge}
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Auto-paste flow */}
              {feature.flow && (
                <div className="flex items-center justify-between mt-2 px-2">
                  {feature.flow.map((item, i) => (
                    <div key={item.step} className="flex items-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15, type: "spring" }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">{item.step}</span>
                      </motion.div>
                      {i < feature.flow.length - 1 && (
                        <motion.svg
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.15 + 0.1 }}
                          className="w-5 h-5 text-stone-300 dark:text-stone-600 mx-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </motion.svg>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Snippet Library */}
              {feature.snippets && (
                <div className="space-y-1.5 mt-2">
                  {feature.snippets.map((snippet, i) => (
                    <motion.div
                      key={snippet.name}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`rounded-lg p-2.5 ${feature.bgLight}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className={`w-3 h-3 ${feature.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${feature.textColor}`}>
                          {snippet.name}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {snippet.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeFeature"
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}
        />
      )}
    </motion.div>
  );
}

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFeature, setActiveFeature] = useState("ai-edit");

  return (
    <section id="features" className="py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI Destekli Özellikler
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Sıradan bir dikte değil,{" "}
            <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">akıllı asistan</span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
            VoiceFlow sadece ses-metin dönüşümü yapmaz. AI ile metninizi düzenler,
            biçimlendirir ve tam istediğiniz yere yapıştırır.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={i}
              isActive={activeFeature === feature.id}
              onClick={() => setActiveFeature(feature.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
