import React from "react";
import type { StripeConnect } from "../../types/fundingRequest";

interface Props {
  stripeConnect: StripeConnect;
  connectLoading: boolean;
  onConnect: () => void;
}

export const StripeConnectCard: React.FC<Props> = ({ stripeConnect, connectLoading, onConnect }) => (
  <div
    className="stripe-connect-card mb-5 d-flex flex-column flex-md-row align-items-md-center justify-content-between"
    style={{
      background: stripeConnect?.payoutsEnabled ? "#ECFDF5" : "#FFF7ED",
      border: "1px solid",
      borderColor: stripeConnect?.payoutsEnabled ? "#34D399" : "#FDBA74",
      borderRadius: 6,
      padding: "18px 24px",
    }}
  >
    <div>
      <p className="mb-1" style={{ fontWeight: 600, fontSize: 15 }}>
        {stripeConnect?.payoutsEnabled ? "✓ Stripe payouts connected" : "Connect Stripe to receive payouts"}
      </p>
      <p className="mb-0 text-small" style={{ color: "#6B7280" }}>
        {stripeConnect?.payoutsEnabled
          ? "Approved funding requests are transferred to your Stripe account automatically."
          : "Approved funding requests are held in escrow until you connect a Stripe account for secure payouts."}
      </p>
    </div>
    {(stripeConnect?.accountId || !stripeConnect?.payoutsEnabled) && (
      <button
        className="bluebtn btn text-white mt-3 mt-md-0"
        style={{ whiteSpace: "nowrap" }}
        onClick={onConnect}
        disabled={connectLoading}
      >
        {connectLoading ? "Redirecting…" : stripeConnect?.accountId ? "Complete onboarding" : "Connect Stripe"}
      </button>
    )}
  </div>
);
