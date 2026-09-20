export const activeBtn: React.CSSProperties = {
  background: "#F0F1FE",
  color: "var(--color-primary)",
  boxShadow: "none",
  fontSize: 14,
  borderRadius: 4,
  border: "1px solid var(--color-primary)",
};

export const inactiveBtn: React.CSSProperties = {
  borderRadius: 4,
  color: "#B3B3B3",
  boxShadow: "none",
  fontSize: 14,
  background: "white",
  border: "1px solid #C4C4C4",
};

export const FUNDING_TYPES = {
  ONE_OFF: "one-off",
  MONTHLY: "monthly",
  THIRD_PARTY: "third-party",
} as const;
