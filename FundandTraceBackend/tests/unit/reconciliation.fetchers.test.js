// Gateway fetcher logic — pagination and ID mapping with mocked transports.
process.env.NODE_ENV = "test";
const {
  fetchStripe,
  fetchFlutterwave,
  fetchPaystack,
  diffTransactions,
} = require("../../services/reconciliation");

describe("Reconciliation — fetchStripe mapping", () => {
  it("maps expanded charges to payment_intent + client_reference_id", async () => {
    const fakeClient = {
      balanceTransactions: {
        list: jest.fn().mockResolvedValue({
          has_more: false,
          data: [
            {
              type: "charge",
              status: "succeeded",
              amount: 2500,
              currency: "gbp",
              source: { object: "charge", payment_intent: "pi_123", client_reference_id: "ref-abc" },
            },
            { type: "fee", amount: -50, currency: "gbp" }, // non-charge rows ignored
            {
              type: "charge",
              status: "succeeded",
              amount: 1000,
              currency: "gbp",
              source: "ch_rawstring_no_expand", // unexpanded → skipped, never mismatches
            },
          ],
        }),
      },
    };
    const txs = await fetchStripe(0, fakeClient);
    expect(txs).toEqual([{ id: "pi_123", ref: "ref-abc", amount: 25, currency: "gbp" }]);
    expect(fakeClient.balanceTransactions.list).toHaveBeenCalledWith(
      expect.objectContaining({ expand: ["data.source"] })
    );
  });

  it("follows pagination until has_more is false", async () => {
    const pages = [
      { has_more: true, data: [{ id: "bt_1", type: "charge", status: "succeeded", amount: 100, currency: "usd", source: { object: "charge", payment_intent: "pi_1" } }] },
      { has_more: false, data: [{ id: "bt_2", type: "charge", status: "succeeded", amount: 200, currency: "usd", source: { object: "charge", payment_intent: "pi_2" } }] },
    ];
    const fakeClient = {
      balanceTransactions: {
        list: jest.fn()
          .mockResolvedValueOnce(pages[0])
          .mockResolvedValueOnce(pages[1]),
      },
    };
    const txs = await fetchStripe(0, fakeClient);
    expect(txs).toHaveLength(2);
    expect(fakeClient.balanceTransactions.list).toHaveBeenCalledTimes(2);
    expect(fakeClient.balanceTransactions.list.mock.calls[1][0].starting_after).toBe("bt_1");
  });
});

describe("Reconciliation — fetchFlutterwave pagination", () => {
  const tx = (n) => ({ id: n, tx_ref: `r${n}`, amount: n, currency: "NGN" });

  it("collects all pages before stopping (previously page-1-only)", async () => {
    const calls = [];
    const axiosImpl = {
      get: jest.fn(async (_url, opts) => {
        calls.push(opts.params.page);
        if (opts.params.page === 1) {
          return { data: { data: [tx(1), tx(2)], meta: { pageCount: 2 } } };
        }
        return { data: { data: [tx(3)], meta: { pageCount: 2 } } };
      }),
    };
    const txs = await fetchFlutterwave("2026-01-01", axiosImpl);
    expect(calls).toEqual([1, 2]);
    // Fetcher normalizes gateway ids to strings.
    expect(txs.map((t) => t.id)).toEqual(["1", "2", "3"]);
  });

  it("stops after one page when meta.pageCount is absent", async () => {
    const axiosImpl = {
      get: jest.fn().mockResolvedValue({ data: { data: [tx(9)], meta: {} } }),
    };
    const txs = await fetchFlutterwave("2026-01-01", axiosImpl);
    expect(txs).toHaveLength(1);
    expect(axiosImpl.get).toHaveBeenCalledTimes(1);
  });
});

describe("Reconciliation — fetchPaystack stop condition", () => {
  it("paginates via meta.pageCount", async () => {
    const axiosImpl = {
      get: jest.fn()
        .mockResolvedValueOnce({ data: { data: [{ id: 1, reference: "a", amount: 500 }], meta: { pageCount: 2 } } })
        .mockResolvedValueOnce({ data: { data: [{ id: 2, reference: "b", amount: 700 }], meta: { pageCount: 2 } } }),
    };
    const txs = await fetchPaystack("2026-01-01", axiosImpl);
    expect(txs).toHaveLength(2);
    // Paystack amounts arrive in smallest unit.
    expect(txs[0].amount).toBe(5);
  });

  it("matches gateway ref against DB transactionRef (legacy Stripe rows)", () => {
    const db = [{ _id: "d", amount: 25, transactionId: "", transactionRef: "legacy-ref", paymentId: "" }];
    const result = diffTransactions(
      [{ id: "pi_unknown", ref: "legacy-ref", amount: 25 }],
      db,
      { idKey: "paymentId", refKey: "transactionRef" }
    );
    expect(result.missingInDb).toHaveLength(0);
  });
});
