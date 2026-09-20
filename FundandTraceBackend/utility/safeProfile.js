// Whitelist-based user profile serialization.
//
// Mongoose documents have historically been returned verbatim in responses
// and embedded in JWTs, leaking sensitive fields (encrypted TOTP secret,
// admin activity trail, suspension state, etc.). Every outbound exposure of a
// user profile must go through this whitelist instead of blacklisting fields,
// so new sensitive schema fields are safe by default.
const SAFE_FIELDS = [
  "_id",
  "firstName",
  "lastName",
  "email",
  "phone",
  "code",
  "country",
  "city",
  "language",
  "profilePicture",
  "verified",
  "joined",
  "role",
  // KYC display state (never includes document data or session ids).
  "identityVerification",
];

// Fields safe to embed inside a JWT payload. identityVerification is omitted:
// it is mutable server-side state and is re-read from the DB wherever needed.
const JWT_SAFE_FIELDS = SAFE_FIELDS.filter((f) => f !== "identityVerification");

const pick = (source, fields) => {
  if (!source) return null;
  const doc = typeof source.toObject === "function" ? source.toObject() : source;
  const out = {};
  for (const field of fields) {
    if (doc[field] !== undefined) out[field] = doc[field];
  }
  return out;
};

// Full safe projection for API responses (getSingleCampaign organizer cards,
// login payloads, admin user listings...).
exports.safeProfile = (user) => pick(user, SAFE_FIELDS);

// Slimmer projection for embedding in JWTs — keeps tokens small and carries
// only what req.auth readers actually consume (id, role, names, email).
exports.safeJwtProfile = (user) => pick(user, JWT_SAFE_FIELDS);
