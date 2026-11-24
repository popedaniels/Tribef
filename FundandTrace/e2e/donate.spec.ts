import { test, expect } from "@playwright/test";
import { NG, UK, captureCheckout, fillDonor, acceptTermsAndSubmit } from "./helpers";

test.describe("Donate: fees are added transparently and the contract holds", () => {
  test("African rails add the processor fee at cost; total = donation + fee", async ({ page }) => {
    const posted = await captureCheckout(page);
    await page.goto(`/donate/${NG}`);
    await page.locator("input[name=rail][value=paystack]").check();
    await page.fill("input[inputmode=decimal]", "10000");
    const summary = page.locator("dl").first();
    await expect(summary).toContainText(/Card processing fee \(charged by (Paystack|Flutterwave), at cost\)/);
    await expect(summary).toContainText("Platform fee");
    await fillDonor(page);
    await acceptTermsAndSubmit(page);
    await expect.poll(() => posted.length).toBeGreaterThan(0);
    const body = posted[0].body as { amount: number; meta: { processingFee: number; tip: number } };
    expect(body.meta.processingFee).toBeGreaterThan(0);
    expect(body.meta.tip).toBe(0); // tips are never preselected
    expect(Math.round((body.amount - body.meta.processingFee) * 100) / 100).toBe(10000);
    // The button shows exactly what will be charged, kobo included.
    const exact = body.amount.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(body.amount) ? 0 : 2, maximumFractionDigits: 2 });
    await expect(page.getByRole("button", { name: /^Donate/ })).toContainText(`₦${exact}`);
  });

  test("UK cards: the fee is an unticked opt-in; Gift Aid and team ride along", async ({ page }) => {
    const posted = await captureCheckout(page);
    await page.goto(`/donate/${UK}?team=kaduna-runners`);
    await page.fill("input[inputmode=decimal]", "50");
    const optIn = page.getByRole("checkbox", { name: /to cover the card fee/ });
    await expect(optIn).not.toBeChecked();
    await expect(page.locator("dl").first()).not.toContainText("Card fee you're covering");
    await optIn.check();
    await expect(page.locator("dl").first()).toContainText("Card fee you're covering");
    await expect(page.locator("#team")).toHaveValue("t1");
    await fillDonor(page);
    const giftAid = page.getByRole("checkbox", { name: /I want to Gift Aid my donation/ });
    await expect(giftAid).not.toBeChecked();
    await giftAid.check();
    await page.fill("#gaHouse", "12");
    await page.fill("#gaPostcode", "sw1a 1aa");
    await acceptTermsAndSubmit(page);
    await expect.poll(() => posted.length).toBeGreaterThan(0);
    const body = posted[0].body as { amount: number; meta: Record<string, unknown> };
    const fee = Number(body.meta.processingFee);
    expect(fee).toBeGreaterThan(0);
    expect(body.meta.coverFee).toBe(true);
    expect(Math.round((body.amount - fee) * 100) / 100).toBe(50);
    expect(body.meta.teamId).toBe("t1");
    expect(body.meta.giftAid).toMatchObject({ declared: true, houseNameOrNumber: "12", postcode: "SW1A 1AA", firstName: "Ada", lastName: "Obi" });
  });

  test("Gift Aid needs a UK postcode before checkout", async ({ page }) => {
    const posted = await captureCheckout(page);
    await page.goto(`/donate/${UK}`);
    await page.fill("input[inputmode=decimal]", "20");
    await fillDonor(page);
    await page.getByRole("checkbox", { name: /I want to Gift Aid my donation/ }).check();
    await page.fill("#gaHouse", "12");
    await page.fill("#gaPostcode", "12345");
    await acceptTermsAndSubmit(page);
    await expect(page.getByText("Enter your UK home postcode for Gift Aid.")).toBeVisible();
    expect(posted).toHaveLength(0);
  });

  test("matching sponsor is shown with what's left", async ({ page }) => {
    await page.goto(`/donate/${UK}`);
    await page.fill("input[inputmode=decimal]", "40");
    await expect(page.getByRole("status").filter({ hasText: "Northwind Energy" })).toContainText(/\+£40(\.00)? pledged/);
  });

  test("the donate flow is translated (French)", async ({ page }) => {
    await page.goto(`/donate/${NG}`);
    await page.locator("footer select").first().selectOption("fr");
    await expect(page.getByText("Votre don", { exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });
});
