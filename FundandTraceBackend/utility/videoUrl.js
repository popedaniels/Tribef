// Campaign videos: only YouTube links (embedded via youtube-nocookie) or our
// own Cloudinary uploads. Hosts are checked by parsing the URL, never with
// .includes(), which "https://evil.example/?youtube.com" would pass.
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);

function youtubeId(raw) {
  let u;
  try {
    u = new URL(String(raw || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !YT_HOSTS.has(u.hostname.toLowerCase())) return null;
  let id = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  else if (u.pathname === "/watch") id = u.searchParams.get("v");
  else id = (/^\/(embed|shorts|live)\/([^/?#]+)/.exec(u.pathname) || [])[2];
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

const isOwnUpload = (raw) => {
  try {
    const u = new URL(String(raw || ""));
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.includes("/video/upload/");
  } catch {
    return false;
  }
};

/** "" stays "", a valid link is normalised, anything else is null (reject). */
function normaliseCampaignVideo(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const id = youtubeId(s);
  if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  return isOwnUpload(s) ? s : null;
}

module.exports = { youtubeId, normaliseCampaignVideo };
