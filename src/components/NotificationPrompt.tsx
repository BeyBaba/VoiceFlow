"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { isNotificationSupported, requestNotificationPermission } from "@/lib/notifications";

export default function NotificationPrompt() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (Notification.permission !== "default") return;

    const dismissed = localStorage.getItem("notification-prompt-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    await requestNotificationPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("notification-prompt-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 p-5 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-1">
            {t.notifications?.promptTitle || "Bildirimleri Ac"}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
            {t.notifications?.promptText || "Onemli guncellemeler ve hatirlatmalar icin bildirimlere izin verin."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAllow}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              {t.notifications?.allow || "Izin Ver"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              {t.notifications?.dismiss || "Sonra"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
