// Same formula as FundandTraceBackend/services/fees.js. The donate page shows
// the fee from GET /api/fees/schedule; the server re-computes it and rejects a
// mismatch, so both sides must agree (checked by src/utils/__tests__/fees.test.ts).

export type FeeRule = {
  pct: number;
  fixed?: number;
  cap?: number | null;
  fx?: number;
  waiveFixedBelow?: number;
  label?: string;
  methods?: Record<string, Partial<FeeRule>>;
  byDonorRegion?: { eea: Partial<FeeRule>; intl: Partial<FeeRule> };
};
export type FeeMode = "required" | "optional" | "off";
export type FeeSchedule = {
  platformFeePercent: number;
  modes: Record<"paystack" | "flutterwave" | "stripe", FeeMode>;
  rules: Record<string, Record<string, FeeRule>>;
  eea: string[];
  checkedOn: string;
};

export function ruleFor(s: FeeSchedule, rail: string, currency: string, method = "", donorCountry = ""): FeeRule | null {
  const byCur = s.rules[rail];
  if (!byCur) return null;
  let rule: FeeRule | undefined = byCur[currency.toUpperCase()] || byCur["*"];
  if (!rule) return null;
  if (method && rule.methods?.[method]) rule = { ...rule, ...rule.methods[method] } as FeeRule;
  const cc = donorCountry.toUpperCase();
  if (rule.byDonorRegion && cc && cc !== "GB") rule = { ...rule, ...(s.eea.includes(cc) ? rule.byDonorRegion.eea : rule.byDonorRegion.intl) } as FeeRule;
  return rule;
}

export function grossUp(base: number, rule: FeeRule | null): number {
  if (!(base > 0) || !rule) return 0;
  const p = ((rule.pct || 0) + (rule.fx || 0)) / 100;
  const fixed = rule.fixed || 0;
  const solve = (f: number) => (base + f) / (1 - p);
  let total = solve(fixed);
  if (rule.waiveFixedBelow && solve(0) < rule.waiveFixedBelow) total = solve(0);
  let fee = total - base;
  if (rule.cap && fee > rule.cap) fee = rule.cap;
  return Math.ceil(fee * 100 - 1e-9) / 100;
}

export function quote(s: FeeSchedule | null, o: { rail: string; currency: string; base: number; coverFee?: boolean; method?: string; donorCountry?: string }) {
  if (!s) return { mode: "off" as FeeMode, fee: 0, offered: 0, rule: null as FeeRule | null };
  const mode = (s.modes as Record<string, FeeMode>)[o.rail] || "off";
  const rule = ruleFor(s, o.rail, o.currency, o.method, o.donorCountry);
  const offered = grossUp(o.base, rule);
  const fee = mode === "required" || (mode === "optional" && o.coverFee) ? offered : 0;
  return { mode, fee, offered, rule };
}
