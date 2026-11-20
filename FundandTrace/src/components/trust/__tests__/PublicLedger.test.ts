/**
 * @jest-environment node
 */
// The donor-facing verifier must hash exactly like the server
// (FundandTraceBackend/services/ledger.js). These fixtures were produced by
// the server implementation; if either side changes, this test fails.
import { webcrypto } from "crypto";
import { verifyChainInBrowser } from "../PublicLedger";

if (!globalThis.crypto?.subtle) {
  // @ts-ignore - Node test environment
  globalThis.crypto = webcrypto;
}

const SERVER_CHAIN = [
  {
    "campaignId": "60f7117f2ee78d31b4de0f7d",
    "seq": 1,
    "type": "credit",
    "amount": 100,
    "currency": "GBP",
    "refId": "stripe:cs_1",
    "memo": "Donation",
    "at": "2026-11-01T10:00:00.000Z",
    "prevHash": "0000000000000000000000000000000000000000000000000000000000000000",
    "hash": "89392b322ae8cd95c40de56d2e8948c571d63f74440dd31142b3f4514f6a7dc6"
  },
  {
    "campaignId": "60f7117f2ee78d31b4de0f7d",
    "seq": 2,
    "type": "payout",
    "amount": -62.5,
    "currency": "GBP",
    "refId": "payout:fr:1",
    "memo": "Milestone payout to third party",
    "at": "2026-11-05T09:30:00.000Z",
    "prevHash": "89392b322ae8cd95c40de56d2e8948c571d63f74440dd31142b3f4514f6a7dc6",
    "hash": "2f7973128935f309436991215200c851bbd4ee723b0af54cbc976f93c6869ae9"
  }
];

describe("PublicLedger browser verification", () => {
  it("accepts a chain produced by the server", async () => {
    await expect(verifyChainInBrowser(SERVER_CHAIN as never)).resolves.toMatchObject({ valid: true, head: SERVER_CHAIN[1].hash });
  });

  it("rejects an edited amount", async () => {
    const tampered = SERVER_CHAIN.map((e) => ({ ...e }));
    tampered[0].amount = 1000;
    await expect(verifyChainInBrowser(tampered as never)).resolves.toMatchObject({ valid: false, brokenAt: 1 });
  });

  it("rejects a removed entry", async () => {
    await expect(verifyChainInBrowser([SERVER_CHAIN[1]] as never)).resolves.toMatchObject({ valid: false });
  });
});
