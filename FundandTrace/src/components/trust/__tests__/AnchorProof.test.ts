/**
 * @jest-environment node
 */
// Parity with the server (FundandTraceBackend/services/anchoring.js): this
// fixture was produced by the server's merkleRoot/merkleProof.
import { webcrypto } from "crypto";
import { verifyAnchorInBrowser, type AnchorProof } from "../PublicLedger";

if (!globalThis.crypto?.subtle) (globalThis as unknown as { crypto: unknown }).crypto = webcrypto;

const fx = {"root":"737dbaa1d6d3fd488a28815b303e2e81a6fcc928d6778fe5a8e6baca9746b72d","leaf":{"campaignId":"c2","seq":7,"head":"f998fe06afa0cfbe73e0449dc2b1698309e1b5714960f027b2858312b152c275"},"path":[{"hash":"b75dc33a0068a0057066542718406f57505ea34a8325068f768422d6370bf210","side":"left"},{"hash":"29640a4ab1818f98e3e65a7d9a66d316c9dcdad8b2f733aa1e866c9857191b68","side":"right"}]};

const entries = [{ seq: 7, hash: fx.leaf.head }] as unknown as Parameters<typeof verifyAnchorInBrowser>[1];
const proof: AnchorProof = { included: true, anchor: { date: "2026-11-21", root: fx.root, digest: "" }, leaf: fx.leaf, path: fx.path as AnchorProof["path"] };

describe("verifyAnchorInBrowser", () => {
  it("accepts the server's inclusion proof", async () => {
    await expect(verifyAnchorInBrowser(proof, entries)).resolves.toMatchObject({ valid: true, seq: 7 });
  });
  it("rejects a proof that doesn't lead to the published root", async () => {
    const bad = { ...proof, anchor: { ...proof.anchor, root: "0".repeat(64) } };
    await expect(verifyAnchorInBrowser(bad, entries)).resolves.toMatchObject({ valid: false });
  });
  it("detects that the entry was rewritten after the anchor", async () => {
    const changed = [{ seq: 7, hash: "f".repeat(64) }] as unknown as typeof entries;
    await expect(verifyAnchorInBrowser(proof, changed)).resolves.toMatchObject({ valid: false, reason: expect.stringMatching(/changed since/) });
  });
});
