"use client";

import { useI18n } from "@/i18n/context";
import Link from "next/link";

export default function TermsPage() {
  const { t } = useI18n();
  const s = (t as Record<string, unknown>).terms as Record<string, string> | undefined;

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            VoiceFlow
          </Link>
          <Link href="/" className="text-sm text-teal-600 hover:underline">
            {s?.backHome || "Ana Sayfa"}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{s?.title || "Kullanim Sartlari"}</h1>
        <p className="text-sm text-stone-500 mb-10">{s?.lastUpdated || "Son guncelleme: 31 Mart 2026"}</p>

        <div className="space-y-8 text-stone-600 dark:text-stone-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s1Title}</h2>
            <p>{s?.s1Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s2Title}</h2>
            <p>{s?.s2Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s3Title}</h2>
            <p>{s?.s3Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s4Title}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{s?.s4Item1}</li>
              <li>{s?.s4Item2}</li>
              <li>{s?.s4Item3}</li>
              <li>{s?.s4Item4}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s5Title}</h2>
            <p>{s?.s5Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s6Title}</h2>
            <p>{s?.s6Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s7Title}</h2>
            <p>{s?.s7Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s8Title}</h2>
            <p>{s?.s8Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s9Title}</h2>
            <p>{s?.s9Text}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-3">{s?.s10Title}</h2>
            <p>{s?.s10Text}</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} VoiceFlow. {s?.allRightsReserved || "Tum haklari saklidir."}
        </div>
      </footer>
    </div>
  );
}
