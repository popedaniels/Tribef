// Admins must use 2FA: on by default in production (ADMIN_REQUIRE_2FA=false
// turns it off), opt-in elsewhere with ADMIN_REQUIRE_2FA=true.
function adminMfaRequired() {
  const v = process.env.ADMIN_REQUIRE_2FA;
  return v === "true" || (process.env.NODE_ENV === "production" && v !== "false");
}
module.exports = { adminMfaRequired };
