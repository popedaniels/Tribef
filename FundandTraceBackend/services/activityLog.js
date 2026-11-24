const { ActivityLog } = require("../models/activityLogModel");
const logger = require("../utility/logger");

exports.addActivity = async (type, user) => {
  const Activity = new ActivityLog({
    type: type,
    user: user,
    createdAt: Date.now(),
  });

  await Activity.save();
  logger.debug({ activityId: Activity._id, type }, "Activity logged");

  return true;
};

// Admin audit trail. Best-effort (never fails the admin action itself) but
// always records the acting admin, the target and a small details payload.
exports.recordAdminAction = (req, action, { targetType = "", targetId = "", campaignId, details } = {}) => {
  const admin = req.admin || {};
  if (req.res && req.res.locals) req.res.locals.audited = true;
  const entry = new ActivityLog({
    type: `admin:${action}`,
    actorId: admin._id,
    actorName: `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Admin",
    user: admin.email || "",
    targetType,
    targetId: targetId ? String(targetId) : "",
    campaignId: campaignId || undefined,
    details,
    createdAt: new Date(),
  });
  return entry.save().catch((err) => logger.error({ err, action }, "Failed to record admin action"));
};
