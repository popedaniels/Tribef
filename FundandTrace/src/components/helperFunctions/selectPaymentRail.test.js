// Tests for the location-aware payment rail selection (FT-001)
const { selectPaymentRail } = require("./helperFunctions");

describe("selectPaymentRail", () => {
  it("routes Nigeria to Paystack", () => {
    expect(selectPaymentRail("Nigeria")).toBe("paystack");
  });

  it("routes other African countries to Flutterwave", () => {
    ["Ghana", "Kenya", "South Africa", "Uganda", "Rwanda", "Tanzania", "Egypt"].forEach(
      (country) => expect(selectPaymentRail(country)).toBe("flutterwave")
    );
  });

  it("routes the rest of the world to Stripe", () => {
    ["United Kingdom", "United States", "Germany", "Canada"].forEach((country) =>
      expect(selectPaymentRail(country)).toBe("stripe")
    );
  });

  it("defaults to Stripe for unknown/missing country", () => {
    expect(selectPaymentRail(null)).toBe("stripe");
    expect(selectPaymentRail(undefined)).toBe("stripe");
    expect(selectPaymentRail("")).toBe("stripe");
  });

  it("is case-insensitive", () => {
    expect(selectPaymentRail("nigeria")).toBe("paystack");
    expect(selectPaymentRail("GHANA")).toBe("flutterwave");
  });
});