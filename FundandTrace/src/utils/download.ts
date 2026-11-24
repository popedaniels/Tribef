import api from "./api";

/** Download an authenticated file (receipt, statement) and save it. Returns false on failure. */
export async function downloadFile(path: string, fallbackName: string): Promise<boolean> {
  try {
    const res = await api.get(path, { responseType: "blob", timeout: 30000 });
    const cd = String(res.headers["content-disposition"] || "");
    const name = /filename="?([^";]+)"?/.exec(cd)?.[1] || fallbackName;
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch {
    return false;
  }
}
