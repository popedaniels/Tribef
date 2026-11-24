import type { GetServerSideProps } from "next";
import { getApiBaseUrl } from "../utils/api";

// Dynamic sitemap: the main pages plus every live campaign, so new
// campaigns are discoverable by search engines without a redeploy.
const SITE = "https://fundandtrace.com";
const STATIC: [string, string, number][] = [
  ["/", "daily", 1.0],
  ["/Categories", "daily", 0.8],
  ["/workings", "monthly", 0.7],
  ["/fees", "monthly", 0.7],
  ["/vendors", "weekly", 0.6],
  ["/charities", "weekly", 0.6],
  ["/fundraising-stories", "weekly", 0.6],
  ["/fundraisingIdeas", "monthly", 0.5],
  ["/aboutUs", "monthly", 0.5],
  ["/contact", "monthly", 0.4],
  ["/help/donors", "monthly", 0.4],
  ["/help/fundraisers", "monthly", 0.4],
  ["/StartACampaign", "monthly", 0.6],
  ["/privacy", "yearly", 0.2],
  ["/terms", "yearly", 0.2],
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildSitemap(campaigns: { id: string; lastmod: string; category?: string }[], today = new Date().toISOString().slice(0, 10)): string {
  const urls: string[] = STATIC.map(([path, freq, pri]) => `<url><loc>${SITE}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri.toFixed(1)}</priority></url>`);
  const categories = Array.from(new Set(campaigns.map((c) => (c.category || "").toLowerCase()).filter(Boolean)));
  for (const cat of categories) urls.push(`<url><loc>${SITE}/category/${esc(encodeURIComponent(cat))}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`);
  for (const c of campaigns) {
    if (!/^[a-f0-9]{24}$/i.test(c.id)) continue;
    urls.push(`<url><loc>${SITE}/campaign/${c.id}</loc><lastmod>${esc(c.lastmod)}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`);
    urls.push(`<url><loc>${SITE}/campaign/${c.id}/tracker</loc><lastmod>${esc(c.lastmod)}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let campaigns: { id: string; lastmod: string; category?: string }[] = [];
  try {
    const r = await fetch(`${getApiBaseUrl()}/api/discovery/sitemap`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) campaigns = (await r.json())?.data || [];
  } catch {
    // API down: still serve the static pages.
  }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(buildSitemap(campaigns));
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
