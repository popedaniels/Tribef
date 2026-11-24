// Mirror of FundandTraceBackend/utility/videoUrl.js. Parse hosts; never use
// .includes("youtube.com"), which "https://evil.example/?youtube.com" passes.
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);

export function youtubeEmbedUrl(raw: string | undefined | null): string | null {
  let u: URL;
  try {
    u = new URL(String(raw || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !YT_HOSTS.has(u.hostname.toLowerCase())) return null;
  let id: string | null = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  else if (u.pathname === "/watch") id = u.searchParams.get("v");
  else id = (/^\/(embed|shorts|live)\/([^/?#]+)/.exec(u.pathname) || [])[2] || null;
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** True only for an https URL on exactly this host (or a subdomain of it). */
export function isHost(raw: string | undefined | null, host: string): boolean {
  try {
    const h = new URL(String(raw || "")).hostname.toLowerCase();
    return h === host || h.endsWith(`.${host}`);
  } catch {
    return false;
  }
}
