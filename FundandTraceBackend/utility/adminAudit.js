// Records every successful state-changing admin request (POST/PUT/PATCH/DELETE
// that returns 2xx) in the activity log with the acting admin, the route and
// the target id. Mounted after requireAdmin so req.admin is known; new admin
// endpoints are audited automatically. Bodies are NOT stored (they can carry
// personal data); only the action, target and status are.
const { recordAdminAction } = require("../services/activityLog");

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const auditAdminMutations = (req, res, next) => {
  if (!MUTATING.has(req.method)) return next();
  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    if (res.locals && res.locals.audited) return; // handler logged richer details itself
    const routePath = (req.route && req.route.path) || req.path;
    const action = `${req.method} ${req.baseUrl || ""}${routePath}`;
    const targetId = req.params?.id || req.params?.userId || req.params?.campaignId || "";
    recordAdminAction(req, action, {
      targetType: "route",
      targetId,
      details: { status: res.statusCode },
    });
  });
  next();
};

module.exports = { auditAdminMutations };
