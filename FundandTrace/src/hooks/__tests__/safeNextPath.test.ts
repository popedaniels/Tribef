import { safeNextPath } from "../useRequireAuth";

describe("safeNextPath", () => {
  it.each([
    ["/dashboard/account", "/dashboard/account"],
    ["/campaign/abc?tab=updates", "/campaign/abc?tab=updates"],
  ])("keeps same-origin path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", undefined, 42])(
    "rejects unsafe target %p",
    (input) => {
      expect(safeNextPath(input)).toBe("/dashboard");
    }
  );

  it("uses the first value when Next gives an array", () => {
    expect(safeNextPath(["/a", "/b"])).toBe("/a");
  });
});
