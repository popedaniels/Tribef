// Linear-time email shape check with a length cap. The old /^\S+@\S+\.\S+$/
// backtracks polynomially on long inputs (ReDoS), and it ran on public routes.
const RE = /^[^\s@]{1,64}@[^\s@.]{1,63}(?:\.[^\s@.]{1,63}){1,8}$/;
module.exports = (value) => typeof value === "string" && value.length <= 254 && RE.test(value);
