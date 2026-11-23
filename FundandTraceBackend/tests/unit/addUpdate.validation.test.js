const { addUpdateSchema } = require("../../utility/schemas");

// Regression: the dashboard posts { update: {...} }, but the schema validated
// the top level, so every campaign update was rejected with "story is required".
describe("campaign update validation", () => {
  it("accepts what the dashboard actually sends", () => {
    expect(addUpdateSchema.validate({ update: { story: "Roof is on", addedBy: "Ann" } }).error).toBeUndefined();
  });

  it("refuses to let a normal update claim to be sealed evidence", () => {
    expect(addUpdateSchema.validate({ update: { story: "x", evidenceSessionId: "65a0", evidenceIds: ["1"] } }).error).toBeDefined();
  });

  it("only accepts https media links", () => {
    expect(addUpdateSchema.validate({ update: { story: "x", image: "javascript:alert(1)" } }).error).toBeDefined();
    expect(addUpdateSchema.validate({ update: { story: "x", image: "https://res.cloudinary.com/a.jpg" } }).error).toBeUndefined();
  });

  it("requires a story", () => {
    expect(addUpdateSchema.validate({ update: { story: "  " } }).error).toBeDefined();
    expect(addUpdateSchema.validate({ story: "top-level" }).error).toBeDefined();
  });
});
