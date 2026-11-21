const mockStore = new Map();
jest.mock("../../models/jobRunModel", () => ({
  JobRun: {
    create: jest.fn(async (doc) => {
      if (mockStore.has(doc._id)) {
        const e = new Error("dup");
        e.code = 11000;
        throw e;
      }
      mockStore.set(doc._id, { status: "running", attempts: 1, ...doc });
      return doc;
    }),
    findOneAndUpdate: jest.fn(async (filter, update) => {
      const d = mockStore.get(filter._id);
      if (!d || d.attempts >= filter.attempts.$lt) return null;
      const stale = d.status === "running" && d.startedAt < filter.$or[1].startedAt.$lt;
      if (d.status !== "failed" && !stale) return null;
      Object.assign(d, update.$set);
      d.attempts += update.$inc.attempts;
      return d;
    }),
    updateOne: jest.fn(async (filter, update) => Object.assign(mockStore.get(filter._id), update.$set)),
  },
}));

const { runOncePerPeriod, claim } = require("../../services/jobs");

beforeEach(() => mockStore.clear());

describe("runOncePerPeriod", () => {
  it("runs a job once per period even when several instances race", async () => {
    const fn = jest.fn(async () => "ok");
    const results = await Promise.all([1, 2, 3, 4].map(() => runOncePerPeriod("anchor", "2026-11-22", fn)));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(results.filter((r) => r.ran)).toHaveLength(1);
    expect(mockStore.get("anchor:2026-11-22").status).toBe("succeeded");
  });

  it("lets a later tick retry a failed run, up to the attempt limit", async () => {
    const fail = jest.fn(async () => {
      throw new Error("boom");
    });
    await runOncePerPeriod("anchor", "d", fail);
    await runOncePerPeriod("anchor", "d", fail);
    await runOncePerPeriod("anchor", "d", fail);
    await runOncePerPeriod("anchor", "d", fail); // 4th: no attempts left
    expect(fail).toHaveBeenCalledTimes(3);
    expect(mockStore.get("anchor:d").status).toBe("failed");
  });

  it("takes over a run that has been stuck for over an hour", async () => {
    mockStore.set("anchor:d", { _id: "anchor:d", status: "running", attempts: 1, startedAt: new Date(Date.now() - 2 * 3600e3) });
    expect(await claim("anchor", "d")).toBe(true);
    mockStore.set("anchor:e", { _id: "anchor:e", status: "running", attempts: 1, startedAt: new Date() });
    expect(await claim("anchor", "e")).toBe(false);
  });
});
