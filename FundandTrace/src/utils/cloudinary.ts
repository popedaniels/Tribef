// Cloudinary direct-upload URL builder.
// The cloud name can be overridden per environment; the defaults preserve
// the cloud names previously hardcoded at each call site.
const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

export function cloudinaryUploadUrl(
  cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "wisdomosara",
  resourceType: "image" | "video" | "auto" = "image"
): string {
  return `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/upload`;
}

// ── Delivery: right-sized, modern-format campaign images ───────────────────
// Organisers upload full-size phone photos (often 3–8 MB). For Cloudinary
// URLs we ask for f_auto (AVIF/WebP where supported), q_auto and a width, and
// offer a srcset so phones download a ~400–800 px image instead of the
// original. Other URLs (local /images, other hosts) are returned unchanged.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export function cdnImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  const m = CLOUDINARY_UPLOAD.exec(url);
  if (!m) return url;
  // Don't stack transformations if the URL already has some.
  if (/^(?:[a-z]{1,3}_[^/,]+,?)+\//.test(m[2])) return url;
  return `${m[1]}f_auto,q_auto,c_limit,w_${Math.round(width)}/${m[2]}`;
}

/** srcset/sizes props for an <img>, or {} when the URL can't be transformed. */
export function responsiveImage(url: string | undefined | null, widths: number[], sizes: string) {
  if (!url || !CLOUDINARY_UPLOAD.test(url)) return {};
  return { srcSet: widths.map((w) => `${cdnImage(url, w)} ${w}w`).join(", "), sizes };
}
