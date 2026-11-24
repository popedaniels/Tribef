import type { Page, Route } from "@playwright/test";

export const NG = "60f7117f2ee78d31b4de0f7d"; // NGN campaign
export const UK = "60f7117f2ee78d31b4de0f81"; // GBP charity campaign with Gift Aid, teams, matching

/** Capture checkout requests instead of reaching a payment provider. */
export async function captureCheckout(page: Page) {
  const posted: { url: string; body: Record<string, unknown> }[] = [];
  const stop = (route: Route) => {
    if (route.request().method() !== "POST") return route.continue();
    const raw = route.request().postDataJSON() || {};
    posted.push({ url: route.request().url(), body: raw.payment || raw });
    return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "e2e: stopped before the payment provider" }) });
  };
  await page.route("**/api/donations/**", stop);
  // Stripe.js is a third-party script; stub it so the Stripe path reaches our API.
  await page.route("https://js.stripe.com/**", (r) => r.fulfill({ contentType: "application/javascript", body: "window.Stripe=function(){return{redirectToCheckout:async()=>({})}}" }));
  return posted;
}

export async function fillDonor(page: Page) {
  await page.fill("#firstName", "Ada");
  await page.fill("#lastName", "Obi");
  await page.fill("#email", "ada@example.com");
  const country = page.locator("#country");
  if (!(await country.inputValue())) await country.selectOption({ index: 1 });
}

export async function acceptTermsAndSubmit(page: Page) {
  await page.getByRole("checkbox", { name: /I agree to the/ }).check();
  await page.getByRole("button", { name: /^Donate/ }).click();
}

export const money = (s: string) => Number(s.replace(/[^\d.]/g, ""));
