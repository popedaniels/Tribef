import { detectCountry, readCountryCookie, visitorCountry } from "../geo";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

describe("visitor country", () => {
  it("prefers the CDN's geo header", () => {
    expect(detectCountry(h({ "cf-ipcountry": "gb", "accept-language": "en-NG" }))).toBe("GB");
    expect(detectCountry(h({ "x-vercel-ip-country": "KE" }))).toBe("KE");
  });

  it("ignores unknown/Tor markers and falls back to the browser language region", () => {
    expect(detectCountry(h({ "cf-ipcountry": "XX", "accept-language": "en-NG,en;q=0.9" }))).toBe("NG");
    expect(detectCountry(h({ "cf-ipcountry": "T1", "accept-language": "fr-FR" }))).toBe("FR");
    expect(detectCountry(h({ "accept-language": "en" }))).toBe("");
    expect(detectCountry(h({}))).toBe("");
  });

  it("reads the cookie and maps to country, currency and calling code", () => {
    expect(readCountryCookie("a=1; ft_country=GH; b=2")).toBe("GH");
    expect(readCountryCookie("ft_country=<script>")).toBe("");
    expect(visitorCountry("ft_country=GB")).toMatchObject({ name: "United Kingdom", currency: "GBP" });
    expect(visitorCountry("")).toBeNull();
  });
});
