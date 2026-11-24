const isEmail = require("../../utility/isEmail");
it("accepts normal addresses and rejects junk quickly", () => {
  for (const ok of ["a@b.co", "ada.obi+x@mail.example.org", "u@sub.domain.ng"]) expect(isEmail(ok)).toBe(true);
  for (const bad of ["", "a@b", "a b@c.co", "@b.co", "a@.co", null, {}]) expect(isEmail(bad)).toBe(false);
  const t0 = Date.now();
  expect(isEmail("a@" + "a.".repeat(50000) + "@")).toBe(false); // was catastrophic with \S+@\S+\.\S+
  expect(Date.now() - t0).toBeLessThan(50);
});
