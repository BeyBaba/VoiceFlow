"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";

export function ServiceWorkerRegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const { t } = useI18n();
  const swUpdate = (t as Record<string, unknown>).swUpdate as Record<string, string> | undefined;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.update();

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    setShowUpdate(false);
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => {
      window.location.reload();
    });
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-primary text-white px-6 py-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-4 max-w-md">
      <div className="flex-1">
        <p className="text-sm font-semibold">{swUpdate?.title || "Yeni guncelleme mevcut!"}</p>
        <p className="text-xs text-white/70 mt-0.5">{swUpdate?.description || "Daha iyi bir deneyim icin guncelle."}</p>
      </div>
      <button
        onClick={handleUpdate}
        className="px-4 py-2 bg-white text-primary text-sm font-bold rounded-xl hover:bg-white/90 transition-colors shrink-0"
      >
        {swUpdate?.button || "Guncelle"}
      </button>
    </div>
  );
}
