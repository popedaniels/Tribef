// Loose name comparison for bank-account checks: the provider returns the
// name as the bank holds it ("ADEBAYO JOHN OLUWASEUN", "ADE ROOFING LTD"),
// which rarely matches what someone typed character for character.
// True when at least 60% of the words agree, ignoring order, case,
// punctuation and company suffixes.
function namesMatch(a, b) {
  const norm = (s) =>
    String(s || "")
      .toUpperCase()
      .replace(/\b(LIMITED|LTD|PLC|NIG|NIGERIA|INC|LLC|CO|COMPANY|THE|AND|&)\b/g, " ")
      .replace(/[^A-Z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);
  const x = new Set(norm(a));
  const y = norm(b);
  if (!x.size || !y.length) return false;
  const shared = y.filter((w) => x.has(w)).length;
  return shared / Math.max(x.size, y.length) >= 0.6;
}

module.exports = { namesMatch };
