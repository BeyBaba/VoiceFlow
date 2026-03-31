"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/i18n/context";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
