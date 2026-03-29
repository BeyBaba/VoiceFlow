"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (sessionId) {
      // Small delay for the confetti feeling
      const timer = setTimeout(() => {
        setStatus("success");
        // Determine plan from URL or just show generic success
        setPlanName("VoiceFlow");
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setStatus("error");
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-950 to-stone-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        {status === "loading" && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-teal-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-stone-400 text-lg">
              Ödemeniz doğrulanıyor...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-8">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-teal-500/30"
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </motion.div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Ödeme Başarılı!
              </h1>
              <p className="text-stone-400 text-lg leading-relaxed">
                {planName} planınız aktif edildi. Artık tüm premium
                özelliklere erişebilirsiniz.
              </p>
            </div>

            {/* Info card */}
            <div className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-teal-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-stone-400">Durum</p>
                  <p className="text-white font-semibold">Aktif</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-stone-400">Sonraki adım</p>
                  <p className="text-white font-semibold">
                    Masaüstü uygulamayı açın ve Google ile giriş yapın
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/api/download"
                download
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-500 hover:to-teal-400 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
              >
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Uygulamayı İndir
              </a>
              <a
                href="/"
                className="px-6 py-3 rounded-xl border border-stone-600 text-stone-300 font-semibold hover:border-stone-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Bir şeyler yanlış gitti
            </h1>
            <p className="text-stone-400">
              Ödeme bilgileriniz bulunamadı. Lütfen tekrar deneyin.
            </p>
            <a
              href="/#pricing"
              className="inline-block px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-all"
            >
              Fiyatlandırmaya Dön
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-950">
          <div className="text-stone-400">Yükleniyor...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
