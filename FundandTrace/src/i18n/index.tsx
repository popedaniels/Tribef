import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EN, LOCALES, Locale, MessageKey, MESSAGES } from "./messages";

export type { Locale, MessageKey };
export { LOCALES };
const COOKIE = "ft_lang";
const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v);

/** Pure translator: falls back to English per key; {name} placeholders are replaced. */
export function translate(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const s = MESSAGES[locale]?.[key] ?? EN[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Saved choice, else the browser's language if we support it, else English. */
export function detectLocale(cookie = "", languages: readonly string[] = []): Locale {
  const saved = /(?:^|;\s*)ft_lang=([a-z]{2})/.exec(cookie)?.[1];
  if (isLocale(saved)) return saved;
  for (const l of languages) {
    const base = l.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: MessageKey, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx>({ locale: "en", setLocale: () => {}, t: (k, v) => translate("en", k, v) });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Server render and first client render are English (no hydration mismatch);
  // the stored/browser language applies straight after mount.
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    setLocaleState(detectLocale(document.cookie, navigator.languages || [navigator.language]));
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);
  const value = useMemo<Ctx>(() => ({ locale, setLocale, t: (k, v) => translate(locale, k, v) }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span>{t("lang.label")}</span>
      <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} style={{ padding: "4px 8px", borderRadius: 6 }}>
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
