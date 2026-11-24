import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// Low-data mode: smaller images (rewritten by the service worker), no
// animations, video embeds load only on tap. "auto" follows the browser's
// Save-Data setting or a 2G connection.
export type LowDataSetting = "auto" | "on" | "off";
const KEY = "ft_lowdata";

type NetInfo = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
const connection = (): NetInfo | undefined => (typeof navigator !== "undefined" ? (navigator as unknown as { connection?: NetInfo }).connection : undefined);

export function effectiveLowData(setting: LowDataSetting, net: NetInfo | undefined = connection()): boolean {
  if (setting === "on") return true;
  if (setting === "off") return false;
  return Boolean(net?.saveData) || /(^|-)2g$/.test(net?.effectiveType || "");
}

type Ctx = { setting: LowDataSetting; lowData: boolean; setSetting: (s: LowDataSetting) => void };
const LowDataContext = createContext<Ctx>({ setting: "auto", lowData: false, setSetting: () => {} });

function tellServiceWorker(on: boolean) {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "lowdata", value: on })).catch(() => {});
}

export function LowDataProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSettingState] = useState<LowDataSetting>("auto");
  const [lowData, setLowData] = useState(false);

  useEffect(() => {
    let saved: LowDataSetting = "auto";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "on" || v === "off") saved = v;
    } catch {
      /* storage unavailable */
    }
    setSettingState(saved);
  }, []);

  useEffect(() => {
    const apply = () => {
      const on = effectiveLowData(setting);
      setLowData(on);
      document.documentElement.classList.toggle("ft-lowdata", on);
      tellServiceWorker(on);
    };
    apply();
    const net = connection();
    net?.addEventListener?.("change", apply);
    return () => net?.removeEventListener?.("change", apply);
  }, [setting]);

  const setSetting = useCallback((s: LowDataSetting) => {
    setSettingState(s);
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  return <LowDataContext.Provider value={{ setting, lowData, setSetting }}>{children}</LowDataContext.Provider>;
}

export const useLowData = () => useContext(LowDataContext);

export function LowDataToggle() {
  const { setting, lowData, setSetting } = useLowData();
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span>Data saver</span>
      <select value={setting} onChange={(e) => setSetting(e.target.value as LowDataSetting)} style={{ padding: "4px 8px", borderRadius: 6 }} aria-describedby="lowdata-state">
        <option value="auto">Automatic</option>
        <option value="on">On</option>
        <option value="off">Off</option>
      </select>
      <span id="lowdata-state" className="sr-only">{lowData ? "Data saver is on" : "Data saver is off"}</span>
    </label>
  );
}
