export type VendorPublic = {
  id: string;
  legalName: string;
  tradingName?: string;
  category: string;
  country: string;
  city?: string;
  website?: string;
  description?: string;
  registrationNumber: string;
  registryUrl?: string;
  verifiedAt?: string;
  bank: { bankName: string; last4: string; currency: string };
  stats?: { payouts: number; totals: Record<string, number> };
};
export const VENDOR_CATEGORIES = ["Hospital / Healthcare Provider", "Educational Institution", "Accredited NGO", "Licensed Contractor", "Supplier", "Other"];
export const VENDOR_COUNTRIES: [string, string][] = [
  ["NG", "Nigeria"],
  ["GH", "Ghana"],
  ["KE", "Kenya"],
  ["ZA", "South Africa"],
  ["UG", "Uganda"],
  ["TZ", "Tanzania"],
  ["RW", "Rwanda"],
  ["GB", "United Kingdom"],
  ["US", "United States"],
];
export const countryName = (cc: string) => VENDOR_COUNTRIES.find(([c]) => c === cc)?.[1] || cc;
