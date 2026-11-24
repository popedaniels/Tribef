import fs from "fs";
import path from "path";
import vm from "vm";
import { effectiveLowData } from "../lowData";

// Load public/sw.js in a sandbox and pull out its pure helpers.
function loadSw() {
  const listeners: Record<string, unknown> = {};
  const cache = { match: async () => undefined, put: async () => undefined, keys: async () => [], delete: async () => true, addAll: async () => undefined };
  const sandbox: Record<string, unknown> = {
    self: { addEventListener: (t: string, f: unknown) => (listeners[t] = f), location: { origin: "https://fundandtrace.com" }, skipWaiting: () => undefined },
    caches: { open: async () => cache, keys: async () => [], match: async () => undefined },
    URL,
    Response: class {},
    Request: class {},
    fetch: async () => undefined,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../../../public/sw.js"), "utf8") + "\n;this.economyImageUrl = economyImageUrl;", sandbox);
  return sandbox as unknown as { economyImageUrl: (u: URL) => string | null };
}

describe("data saver", () => {
  it("rewrites Cloudinary images to small economy versions only", () => {
    const { economyImageUrl } = loadSw();
    expect(economyImageUrl(new URL("https://res.cloudinary.com/acme/image/upload/v1/campaign.jpg"))).toBe("https://res.cloudinary.com/acme/image/upload/f_auto,q_auto:eco,w_480,c_limit/v1/campaign.jpg");
    expect(economyImageUrl(new URL("https://res.cloudinary.com/acme/video/upload/v1/clip.mp4"))).toBeNull();
    expect(economyImageUrl(new URL("https://example.com/image/upload/x.jpg"))).toBeNull();
  });
  it("turns on automatically for Save-Data or 2G only", () => {
    expect(effectiveLowData("auto", { saveData: true })).toBe(true);
    expect(effectiveLowData("auto", { effectiveType: "slow-2g" })).toBe(true);
    expect(effectiveLowData("auto", { effectiveType: "4g" })).toBe(false);
    expect(effectiveLowData("off", { saveData: true })).toBe(false);
    expect(effectiveLowData("on", { effectiveType: "4g" })).toBe(true);
  });
});
