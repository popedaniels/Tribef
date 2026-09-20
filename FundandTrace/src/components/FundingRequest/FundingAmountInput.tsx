import React from "react";

interface Props {
  value: number;
  currency?: string;
  max?: number;
  onChange: (value: number) => void;
  onShowDropdown?: () => void;
}

export const FundingAmountInput: React.FC<Props> = ({ value, currency, max, onChange, onShowDropdown }) => (
  <div className="d-flex money" style={{ border: "1px solid #C4C4C4", borderRadius: 4 }}>
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        height: "50px",
        padding: "5px 15px",
        background: "#fafafa",
      }}
    >
      {currency == "USD" ? "$" : currency == "GBP" ? "£" : "₦"}
    </div>
    <input
      type="number"
      min="0"
      max={max}
      className="money-input"
      value={value == 0 || value?.toString().includes("-") ? "" : value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ borderStyle: "none" }}
    />
    <div style={{ position: "relative" }}>
      <div
        onClick={onShowDropdown}
        className="d-flex align-items-center justify-content-center"
        style={{
          height: "50px",
          padding: "5px 15px",
          background: "#F2F2F2",
          border: "0.5px solid #C4C4C4",
          borderRadius: "0px 4px 4px 0px",
        }}
        role="button"
      >
        <p className="mb-0 mr-2">{currency}</p>
      </div>
    </div>
  </div>
);
