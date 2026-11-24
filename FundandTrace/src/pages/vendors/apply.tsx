import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import Layout from "../../components/Layout";
import Navbar from "../../components/Navbar/Navbar";
import api from "../../utils/api";
import BankAccountFields, { BankDetails } from "../../components/trust/BankAccountFields";
import { selectAuthStateState } from "../../../store/slices/authSlice";
import { VENDOR_CATEGORIES, VENDOR_COUNTRIES } from "../../types/vendor";
import styles from "../../components/campaignPage/Vendors.module.scss";

const CURRENCY: Record<string, string> = { NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", UG: "UGX", TZ: "TZS", RW: "RWF", GB: "GBP", US: "USD" };

export default function VendorApply() {
  const { authenticated } = useSelector(selectAuthStateState);
  const [f, setF] = useState({ legalName: "", tradingName: "", category: "", country: "NG", city: "", address: "", registrationNumber: "", taxId: "", website: "", contactEmail: "", contactPhone: "", description: "" });
  const [bank, setBank] = useState<BankDetails>({ bankCode: "", bankName: "", accountNumber: "", accountName: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const currency = CURRENCY[f.country] || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      await api.post("/api/vendors", { ...f, bank: { ...bank, currency } });
      setState("done");
    } catch (err) {
      setState("idle");
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Couldn't submit. Please try again.");
    }
  };

  return (
    <Layout title="Suggest a vendor | Fund&Trace" description="Suggest a hospital, school or supplier for Fund&Trace's verified vendor network.">
      <Navbar />
      <main className={styles.page} style={{ maxWidth: 760 }}>
        <h1>Suggest a vendor</h1>
        <p className="ft-muted">
          We check the registration against the public register, confirm the bank account name with our payment provider, and contact the vendor before adding it. This usually
          takes 2–3 working days.
        </p>
        {!authenticated ? (
          <p>
            Please <Link href="/SignUp/SignIn">sign in</Link> to suggest a vendor.
          </p>
        ) : state === "done" ? (
          <div className="ft-card" role="status" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20 }}>Thanks, we&apos;ve received it</h2>
            <p className="mb-0">We&apos;ll email you when the checks are done. Once verified, it will appear in the <Link href="/vendors">vendor directory</Link> and in the funding request form.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <label>Registered (legal) name<input className="form-control" required value={f.legalName} onChange={set("legalName")} maxLength={140} /></label>
            <label>Trading name <span className="ft-muted">(if different)</span><input className="form-control" value={f.tradingName} onChange={set("tradingName")} maxLength={140} /></label>
            <div className={styles.two}>
              <label>Category
                <select className="form-control" required value={f.category} onChange={set("category")}>
                  <option value="">Select…</option>
                  {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Country
                <select className="form-control" value={f.country} onChange={set("country")}>
                  {VENDOR_COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className={styles.two}>
              <label>Registration number<input className="form-control" required value={f.registrationNumber} onChange={set("registrationNumber")} maxLength={60} placeholder={f.country === "NG" ? "e.g. RC 123456" : f.country === "GB" ? "Companies House or charity number" : ""} /></label>
              <label>Tax ID <span className="ft-muted">(optional)</span><input className="form-control" value={f.taxId} onChange={set("taxId")} maxLength={60} /></label>
            </div>
            <div className={styles.two}>
              <label>City<input className="form-control" value={f.city} onChange={set("city")} maxLength={80} /></label>
              <label>Website<input className="form-control" type="url" value={f.website} onChange={set("website")} placeholder="https://" maxLength={200} /></label>
            </div>
            <label>Address<input className="form-control" value={f.address} onChange={set("address")} maxLength={240} /></label>
            <div className={styles.two}>
              <label>Contact email<input className="form-control" type="email" value={f.contactEmail} onChange={set("contactEmail")} maxLength={160} /></label>
              <label>Contact phone<input className="form-control" type="tel" value={f.contactPhone} onChange={set("contactPhone")} maxLength={40} /></label>
            </div>
            <label>What they provide <span className="ft-muted">(optional)</span><textarea className="form-control" rows={3} value={f.description} onChange={set("description")} maxLength={600} /></label>
            <fieldset>
              <legend style={{ fontSize: 17 }}>Bank account for payments ({currency})</legend>
              <p className="ft-muted" style={{ fontSize: 14 }}>It must be in the vendor&apos;s registered name. We confirm the name with our payment provider.</p>
              <BankAccountFields
                currency={currency}
                idPrefix="vendor-bank"
                value={bank}
                onChange={setBank}
                fallback={
                  <div className={styles.two}>
                    <label>Bank name<input className="form-control" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} /></label>
                    <label>Sort code / routing<input className="form-control" value={bank.bankCode} onChange={(e) => setBank({ ...bank, bankCode: e.target.value })} /></label>
                    <label>Account number<input className="form-control" inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\s/g, "") })} /></label>
                    <label>Account name<input className="form-control" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} /></label>
                  </div>
                }
              />
            </fieldset>
            {error && <p className="text-danger" role="alert">{error}</p>}
            <button type="submit" className="ft-btn ft-btn--primary" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Submit for checks"}
            </button>
          </form>
        )}
      </main>
    </Layout>
  );
}
