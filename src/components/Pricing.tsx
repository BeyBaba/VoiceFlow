"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";

function getTrialDaysLeft(trialEndDate: string | null | undefined): number {
  if (!trialEndDate) return 0;
  const diff = new Date(trialEndDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const plans = [
  {
    name: "Free",
    description: "7 günlük ücretsiz deneme",
    priceMonthly: 0,
    priceYearly: 0,
    priceLifetime: null,
    badge: null,
    ctaStyle: "secondary" as const,
    planType: "free",
    features: [
      { text: "Günlük 2.000 kelime", included: true },
      { text: "12+ dil desteği", included: true },
      { text: "AI otomatik düzenleme", included: true },
      { text: "Otomatik yapıştırma", included: true },
      { text: "Temel transkripsiyon", included: true },
      { text: "Komut modu", included: false },
      { text: "Snippet kütüphanesi", included: false },
      { text: "Öncelikli destek", included: false },
    ],
  },
  {
    name: "Pro",
    description: "Profesyoneller için",
    priceMonthly: 8,
    priceYearly: 60,
    priceLifetime: null,
    badge: null,
    ctaStyle: "primary" as const,
    planType: "pro",
    features: [
      { text: "Sınırsız kelime", included: true },
      { text: "12+ dil desteği", included: true },
      { text: "AI otomatik düzenleme", included: true },
      { text: "Otomatik yapıştırma", included: true },
      { text: "Gelişmiş transkripsiyon", included: true },
      { text: "Komut modu", included: true },
      { text: "Snippet kütüphanesi", included: true },
      { text: "Öncelikli destek", included: true },
    ],
  },
  {
    name: "Lifetime",
    description: "Bir kere öde, sonsuza dek kullan",
    priceMonthly: null,
    priceYearly: null,
    priceLifetime: 149,
    badge: "En Popüler",
    ctaStyle: "lifetime" as const,
    planType: "lifetime",
    features: [
      { text: "Sınırsız kelime — sonsuza dek", included: true },
      { text: "12+ dil desteği", included: true },
      { text: "AI otomatik düzenleme", included: true },
      { text: "Otomatik yapıştırma", included: true },
      { text: "Gelişmiş transkripsiyon", included: true },
      { text: "Komut modu", included: true },
      { text: "Snippet kütüphanesi", included: true },
      { text: "Öncelikli destek + erken erişim", included: true },
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const { data: session } = useSession();

  const trialDaysLeft = session?.user
    ? getTrialDaysLeft(session.user.trialEndDate)
    : 0;
  const trialExpired = session?.user?.plan === "free" && trialDaysLeft === 0 && !!session.user.trialEndDate;

  const getFreeCta = () => {
    if (!session) return "Giriş Yap ve Başla";
    if (session.user?.plan === "pro" || session.user?.plan === "lifetime") return "Zaten Aktif ✓";
    if (trialExpired) return "Deneme Süresi Doldu";
    if (trialDaysLeft > 0) return `Ücretsiz İndir (${trialDaysLeft} gün kaldı)`;
    return "Giriş Yap ve Başla";
  };

  const handleCheckout = async (planType: string) => {
    // Giriş yapmamışsa → Google ile giriş yap
    if (!session) {
      signIn("google");
      return;
    }

    // Free plan
    if (planType === "free") {
      if (session.user?.plan === "pro" || session.user?.plan === "lifetime") return;

      if (trialExpired) {
        // Trial dolmuş → Pricing'e scroll (Pro veya Lifetime alsın)
        const proCard = document.querySelector('[data-plan="pro"]');
        proCard?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      // Trial aktif → indirmeye izin ver
      window.location.href = "/api/download";
      return;
    }

    // Paid plans
    setLoading(planType);

    try {
      const actualPlanType =
        planType === "pro"
          ? isYearly
            ? "pro-yearly"
            : "pro-monthly"
          : "lifetime";

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: actualPlanType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        alert("Ödeme sayfası açılamadı. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/10 to-transparent dark:via-teal-950/20" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 mb-4">
            Fiyatlandırma
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Rakiplerden{" "}
            <span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
              %47 daha uygun
            </span>
          </h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
            Aynı kalite, yarı fiyat. Üstelik Lifetime seçeneğiyle bir kere öde, sonsuza dek kullan.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-stone-900 dark:text-white" : "text-stone-400 dark:text-stone-500"}`}>
            Aylık
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? "bg-teal-600" : "bg-stone-300 dark:bg-stone-600"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? "translate-x-7" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${isYearly ? "text-stone-900 dark:text-white" : "text-stone-400 dark:text-stone-500"}`}>
            Yıllık
          </span>
          {isYearly && (
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
              %38 Tasarruf
            </span>
          )}
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              data-plan={plan.planType}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                plan.badge
                  ? "border-teal-500 dark:border-teal-400 bg-gradient-to-b from-teal-50 to-white dark:from-teal-950/30 dark:to-stone-900/50 shadow-lg shadow-teal-200/40 dark:shadow-teal-900/30 ring-2 ring-teal-500/20"
                  : plan.ctaStyle === "primary"
                  ? "border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-stone-900/50 shadow-md"
                  : "border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900/30 shadow-sm"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 rounded-full shadow-lg">
                    ⭐ {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                {plan.priceLifetime !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">${plan.priceLifetime}</span>
                    <span className="text-stone-500 dark:text-stone-400 text-sm">/tek sefer</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">
                      ${isYearly ? Math.round((plan.priceYearly || 0) / 12) : plan.priceMonthly}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 text-sm">/ay</span>
                    {isYearly && plan.priceYearly && plan.priceYearly > 0 && (
                      <span className="ml-2 text-xs text-stone-400 dark:text-stone-500 line-through">
                        ${plan.priceMonthly}/ay
                      </span>
                    )}
                  </div>
                )}
                {isYearly && plan.priceYearly && plan.priceYearly > 0 && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Yıllık ${plan.priceYearly} olarak faturalandırılır
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleCheckout(plan.planType)}
                disabled={
                  loading !== null ||
                  (plan.planType === "free" && (session?.user?.plan === "pro" || session?.user?.plan === "lifetime"))
                }
                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 mb-8 disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.planType === "free" && trialExpired
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                    : plan.ctaStyle === "lifetime"
                    ? "bg-gradient-to-r from-teal-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5"
                    : plan.ctaStyle === "primary"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {loading === plan.planType ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Yönlendiriliyor...
                  </span>
                ) : plan.planType === "free" ? (
                  <span className="flex items-center justify-center gap-2">
                    {!session && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    {getFreeCta()}
                  </span>
                ) : !session ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Giriş Yap ve {plan.planType === "lifetime" ? "Lifetime Al" : "Pro Al"}
                  </span>
                ) : plan.planType === "lifetime" ? (
                  "Lifetime Al"
                ) : (
                  "Pro Al"
                )}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    {f.included ? (
                      <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={f.included ? "" : "text-stone-400 dark:text-stone-500"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-sm text-stone-400 dark:text-stone-500 mt-10"
        >
          🔒 Google ile giriş yap · 7 gün ücretsiz dene · İstediğin zaman iptal et
        </motion.p>
      </div>
    </section>
  );
}
