// Share card for a campaign (FT-037): 1200×630 JPEG used as og:image, which
// WhatsApp, X, LinkedIn and Facebook show in link previews. Rendered with
// Satori (next/og) using a bundled font, so it doesn't depend on system fonts
// in the Alpine image, then re-encoded to a small JPEG (WhatsApp ignores large
// preview images). Falls back to PNG if sharp isn't installed.
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { ImageResponse } from "next/og";
import { getApiBaseUrl } from "../../../../utils/api";
import { cdnImage } from "../../../../utils/cloudinary";
import { formatMoney } from "../../../../components/helperFunctions/helperFunctions";

const fontDir = path.join(process.cwd(), "src/assets/og");
let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;
const loadFonts = () =>
  (fonts ||= [
    { name: "Inter", data: fs.readFileSync(path.join(fontDir, "Inter-Regular.otf")), weight: 400, style: "normal" },
    { name: "Inter", data: fs.readFileSync(path.join(fontDir, "Inter-Bold.otf")), weight: 700, style: "normal" },
  ]);

type CampaignLite = {
  basicInformation?: { campaignTitle?: string; campaignImage?: string; campaignTagline?: string };
  funding?: { currency?: string; amountRaised?: number; amountExpected?: number };
  verification?: { status?: string };
  identityVerified?: boolean;
};

async function fetchImageDataUrl(url: string): Promise<string | null> {
  if (!/^https:\/\//.test(url)) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null;
    // Satori can't decode WebP; convert when sharp is present.
    if (type.includes("webp")) {
      const sharp = optionalSharp();
      if (!sharp) return null;
      return `data:image/jpeg;base64,${(await sharp(buf).jpeg({ quality: 80 }).toBuffer()).toString("base64")}`;
    }
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function optionalSharp(): null | ((b: Buffer) => { jpeg: (o: object) => { toBuffer: () => Promise<Buffer> } }) {
  try {
    return require("sharp");
  } catch {
    return null;
  }
}

export function card(c: CampaignLite, photo: string | null) {
  const title = (c.basicInformation?.campaignTitle || "A Fund&Trace campaign").slice(0, 90);
  const cur = String(c.funding?.currency || "USD").toUpperCase();
  const raised = Number(c.funding?.amountRaised) || 0;
  const goal = Number(c.funding?.amountExpected) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((100 * raised) / goal)) : 0;
  return (
    <div style={{ width: 1200, height: 630, display: "flex", fontFamily: "Inter", background: "#0b1437", color: "#fff", position: "relative" }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={photo} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", width: 1200, height: 630 }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: photo ? "linear-gradient(180deg, rgba(11,20,55,0.15) 0%, rgba(11,20,55,0.55) 45%, rgba(11,20,55,0.95) 100%)" : "linear-gradient(135deg, #1b2a6b, #0b1437)",
        }}
      />
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 48, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", background: "#22c55e", color: "#052e16", fontSize: 22, fontWeight: 700, padding: "6px 14px", borderRadius: 999 }}>
            ✓ Escrow-protected
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.16)", fontSize: 22, padding: "6px 14px", borderRadius: 999 }}>Every payout published</div>
        </div>
        <div style={{ display: "flex", fontSize: title.length > 50 ? 50 : 60, fontWeight: 700, lineHeight: 1.1, marginBottom: 22 }}>{title}</div>
        {goal > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", height: 14, background: "rgba(255,255,255,0.25)", borderRadius: 7, overflow: "hidden" }}>
              <div style={{ display: "flex", width: `${Math.max(pct, 2)}%`, background: "#22c55e" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, marginTop: 12 }}>
              <span style={{ fontWeight: 700 }}>
                {formatMoney(raised, cur)} raised of {formatMoney(goal, cur)}
              </span>
              <span style={{ opacity: 0.85 }}>fundandtrace.com</span>
            </div>
          </div>
        )}
        {goal <= 0 && <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>fundandtrace.com</div>}
      </div>
    </div>
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "");
  if (!/^[a-f0-9]{24}$/i.test(id)) return res.status(400).end();
  try {
    const r = await fetch(`${getApiBaseUrl()}/api/campaigns/campaign/${id}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return res.redirect(302, "/og-image.jpg");
    const body = await r.json();
    const c: CampaignLite = body?.data || body?.campaign || body || {};
    const photoUrl = cdnImage(c.basicInformation?.campaignImage, 1200).replace("f_auto", "f_jpg");
    const photo = photoUrl ? await fetchImageDataUrl(photoUrl) : null;
    const png = Buffer.from(await new ImageResponse(card(c, photo), { width: 1200, height: 630, fonts: loadFonts() }).arrayBuffer());
    const sharp = optionalSharp();
    const out = sharp ? await sharp(png).jpeg({ quality: 78, mozjpeg: true } as object).toBuffer() : png;
    res.setHeader("Content-Type", sharp ? "image/jpeg" : "image/png");
    // Totals change; let CDNs and crawlers refresh every 10 minutes.
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600, stale-while-revalidate=86400");
    return res.status(200).send(out);
  } catch {
    return res.redirect(302, "/og-image.jpg");
  }
}
