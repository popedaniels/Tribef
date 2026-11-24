import { buildSitemap } from "../../pages/sitemap.xml";
import { campaignLd, jsonLd } from "../structuredData";
import type { Campaign } from "../../types/campaign";

describe("sitemap", () => {
  it("lists main pages, categories and every live campaign (and tracker)", () => {
    const xml = buildSitemap(
      [
        { id: "65a000000000000000000001", lastmod: "2026-11-20", category: "Medical" },
        { id: "not-an-id", lastmod: "2026-11-20" },
      ],
      "2026-11-24"
    );
    expect(xml).toContain("<loc>https://fundandtrace.com/</loc><lastmod>2026-11-24</lastmod>");
    expect(xml).toContain("<loc>https://fundandtrace.com/campaign/65a000000000000000000001</loc><lastmod>2026-11-20</lastmod>");
    expect(xml).toContain("/campaign/65a000000000000000000001/tracker");
    expect(xml).toContain("<loc>https://fundandtrace.com/category/medical</loc>");
    expect(xml).not.toContain("not-an-id");
  });
});

describe("structured data", () => {
  it("describes a campaign with a donate action and breadcrumbs", () => {
    const [page, crumbs] = campaignLd({
      _id: "65a000000000000000000001",
      basicInformation: { campaignTitle: "Clinic roof", campaignTagline: "Fix the roof" },
      category: "Medical",
      organizer: "Ada Obi",
      funding: { currency: "ngn" },
      createdAt: "2026-11-01T00:00:00Z",
    } as unknown as Campaign) as Record<string, unknown>[];
    expect(page).toMatchObject({ "@type": "WebPage", name: "Clinic roof", potentialAction: { "@type": "DonateAction", target: "https://fundandtrace.com/donate/65a000000000000000000001", priceCurrency: "NGN" } });
    expect((crumbs.itemListElement as unknown[]).length).toBe(3);
  });

  it("can't be broken out of with a hostile title", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
