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
