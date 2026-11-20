const { objectIdParam } = require("../../utility/validate");

const run = (value) => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const next = jest.fn();
  objectIdParam("Campaign ID")({}, res, next, value);
  return { res, next };
};

describe("objectIdParam", () => {
  it("passes a valid 24-hex ObjectId through", () => {
    const { res, next } = run("60f7117f2ee78d31b4de0f7d");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  it.each([
    ["short numeric", "56738"],
    ["route segment swallowed by /:id", "campaign"],
    ["12-char string Mongoose would otherwise accept", "aaaaaaaaaaaa"],
    ["literal undefined from a template string", "undefined"],
    ["empty", ""],
  ])("rejects %s with 400", (_label, value) => {
    const { res, next } = run(value);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, status: 400, error: "Invalid Campaign ID" });
  });
});
