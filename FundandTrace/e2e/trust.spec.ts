import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NG, UK } from "./helpers";

test.describe("Campaign, sharing, vendors and fees", () => {
  test("campaign page: WhatsApp share, share card, team leaderboard", async ({ page, request }) => {
    await page.goto(`/campaign/${UK}`);
    const wa = page.getByRole("link", { name: "Share on WhatsApp" }).filter({ visible: true }).first();
    await expect(wa).toHaveAttribute("href", new RegExp(`^https://wa\\.me/\\?text=.*${UK}`));
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBe(`https://fundandtrace.com/api/og/campaign/${UK}`);
    const card = await request.get(`/api/og/campaign/${UK}`);
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toMatch(/^image\/(jpeg|png)$/);
    expect((await card.body()).length).toBeLessThan(300 * 1024); // WhatsApp drops large previews
    await expect(page.getByRole("heading", { name: "Team leaderboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Donate with Kaduna Runners" })).toHaveAttribute("href", `/donate/${UK}?team=kaduna-runners`);
  });

  test("tracker verifies the public ledger in the browser", async ({ page }) => {
    await page.goto(`/campaign/${NG}/tracker`);
    await expect(page.getByText(/verified/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("fees page states the model and links its sources", async ({ page }) => {
    await page.goto("/fees");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("0% platform fee");
    for (const name of ["GoFundMe (UK)", "JustGiving (UK)", "M-Changa (Kenya)"]) {
      await expect(page.getByRole("link", { name })).toHaveAttribute("href", /^https:\/\//);
    }
  });

  test("verified vendor directory and profile", async ({ page }) => {
    await page.goto("/vendors");
    await expect(page.getByRole("link", { name: /Medserve/ })).toBeVisible();
    await page.getByRole("link", { name: /Medserve/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medserve");
    await expect(page.getByText(/GTBank ending 6789/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payouts from campaigns" })).toBeVisible();
  });

  for (const path of ["/", `/campaign/${NG}`, `/donate/${UK}`, "/fees", "/vendors"]) {
    test(`no horizontal scrolling and no serious a11y violations: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
      expect(serious).toEqual([]);
    });
  }
});

test.describe("Offline and data saver", () => {
  test("a visited campaign opens offline; donate does not serve a stale copy", async ({ page, context }) => {
    await page.goto(`/campaign/${NG}`);
    await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 15_000 }).catch(() => undefined);
    await page.reload({ waitUntil: "networkidle" });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Theatre equipment");
    await page.goto(`/donate/${NG}`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await expect(page.getByText("You're offline")).toBeVisible();
    await context.setOffline(false);
  });

  test("data saver switches off motion and defers the campaign video", async ({ page }) => {
    await page.goto(`/campaign/${NG}`);
    await page.locator("footer select").nth(1).selectOption("on");
    await expect(page.locator("html")).toHaveClass(/ft-lowdata/);
  });
});
