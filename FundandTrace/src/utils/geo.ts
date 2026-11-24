// Visitor country, detected at the edge (src/middleware.ts) and kept in the
// `ft_country` cookie as an ISO 3166-1 alpha-2 code. Used for defaults only
// (country field, payment method, "about X in your currency", campaigns near
// you). The visitor can always change it; nothing is charged on its basis.

export type CountryInfo = { code: string; name: string; currency: string; callingCode: string };

// Names match the country list used in forms (locationFunctions.js).
export const COUNTRIES: Record<string, CountryInfo> = {
  NG: { code: "NG", name: "Nigeria", currency: "NGN", callingCode: "234" },
  GH: { code: "GH", name: "Ghana", currency: "GHS", callingCode: "233" },
  KE: { code: "KE", name: "Kenya", currency: "KES", callingCode: "254" },
  UG: { code: "UG", name: "Uganda", currency: "UGX", callingCode: "256" },
  TZ: { code: "TZ", name: "Tanzania", currency: "TZS", callingCode: "255" },
  RW: { code: "RW", name: "Rwanda", currency: "RWF", callingCode: "250" },
  ZA: { code: "ZA", name: "South Africa", currency: "ZAR", callingCode: "27" },
  EG: { code: "EG", name: "Egypt", currency: "EGP", callingCode: "20" },
  GB: { code: "GB", name: "United Kingdom", currency: "GBP", callingCode: "44" },
  IE: { code: "IE", name: "Ireland", currency: "EUR", callingCode: "353" },
  US: { code: "US", name: "United States", currency: "USD", callingCode: "1" },
  CA: { code: "CA", name: "Canada", currency: "CAD", callingCode: "1" },
  AU: { code: "AU", name: "Australia", currency: "AUD", callingCode: "61" },
  DE: { code: "DE", name: "Germany", currency: "EUR", callingCode: "49" },
  FR: { code: "FR", name: "France", currency: "EUR", callingCode: "33" },
  NL: { code: "NL", name: "Netherlands", currency: "EUR", callingCode: "31" },
  SE: { code: "SE", name: "Sweden", currency: "SEK", callingCode: "46" },
  CH: { code: "CH", name: "Switzerland", currency: "CHF", callingCode: "41" },
  AE: { code: "AE", name: "United Arab Emirates", currency: "AED", callingCode: "971" },
  IN: { code: "IN", name: "India", currency: "INR", callingCode: "91" },
};

export const COUNTRY_COOKIE = "ft_country";

/** ISO2 from CDN headers, else from the browser language's region ("en-GB" → GB). */
export function detectCountry(headers: { get(name: string): string | null }): string {
  const fromCdn = (headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || headers.get("x-country-code") || "").toUpperCase();
  if (/^[A-Z]{2}$/.test(fromCdn) && fromCdn !== "XX" && fromCdn !== "T1") return fromCdn;
  const lang = headers.get("accept-language") || "";
  const m = /^[a-z]{2,3}-([A-Z]{2})\b/i.exec(lang.split(",")[0]?.trim() || "");
  return m ? m[1].toUpperCase() : "";
}

export function readCountryCookie(cookie = typeof document !== "undefined" ? document.cookie : ""): string {
  const m = new RegExp(`(?:^|;\\s*)${COUNTRY_COOKIE}=([A-Z]{2})`).exec(cookie || "");
  return m ? m[1] : "";
}

export function visitorCountry(cookie?: string): CountryInfo | null {
  const code = readCountryCookie(cookie);
  return COUNTRIES[code] || (code ? { code, name: "", currency: "", callingCode: "" } : null);
}
