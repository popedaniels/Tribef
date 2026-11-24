// schema.org JSON-LD for search engines. Serialised with "<" escaped so a
// campaign title can never close the <script> element.
import type { Campaign } from "../types/campaign";

const SITE = "https://fundandtrace.com";

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fund&Trace",
  url: SITE,
  logo: `${SITE}/images/logo.png`,
  description: "Crowdfunding where donations are held in escrow and every payout is traced with receipts.",
});

export function campaignLd(campaign: Campaign) {
  const id = String(campaign._id);
  const url = `${SITE}/campaign/${id}`;
  const title = campaign.basicInformation?.campaignTitle || "Fund&Trace campaign";
  const description = campaign.basicInformation?.campaignTagline || String(campaign.content?.story?.[0] || "").replace(/<[^>]+>/g, "").slice(0, 200);
  const isCharity = String(campaign.campaignType || "").toLowerCase() === "charity";
  const currency = String(campaign.funding?.currency || "").toUpperCase();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": url,
      url,
      name: title,
      description,
      image: `${SITE}/api/og/campaign/${id}`,
      ...(campaign.createdAt ? { datePublished: new Date(campaign.createdAt).toISOString() } : {}),
      isPartOf: { "@type": "WebSite", name: "Fund&Trace", url: SITE },
      potentialAction: {
        "@type": "DonateAction",
        target: `${SITE}/donate/${id}`,
        recipient: { "@type": isCharity ? "NGO" : "Person", name: campaign.organizer || title },
        ...(currency ? { priceCurrency: currency } : {}),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Campaigns", item: `${SITE}/Categories` },
        ...(campaign.category
          ? [{ "@type": "ListItem", position: 2, name: campaign.category, item: `${SITE}/category/${encodeURIComponent(campaign.category.toLowerCase())}` }]
          : []),
        { "@type": "ListItem", position: campaign.category ? 3 : 2, name: title, item: url },
      ],
    },
  ];
}
