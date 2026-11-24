// Subject access and erasure for the signed-in user (services/privacy.js).
const privacy = require("../services/privacy");
const { addActivity } = require("../services/activityLog");
const logger = require("../utility/logger");

const userIdOf = (req) => req.auth?.id || req.auth?.profile?._id || null;

exports.exportMine = async (req, res) => {
  try {
    const data = await privacy.exportUserData(userIdOf(req));
    if (!data) return res.status(404).json({ status: 404, error: "Account not found" });
    addActivity("dataExport", req.auth?.email);
    res.set("Cache-Control", "no-store");
    res.set("Content-Disposition", `attachment; filename="fundandtrace-my-data-${new Date().toISOString().slice(0, 10)}.json"`);
    return res.status(200).json(data);
  } catch (err) {
    logger.error({ err }, "Data export failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.deleteMine = async (req, res) => {
  try {
    const result = await privacy.deleteAccount(userIdOf(req), { password: req.body?.password, confirm: req.body?.confirm });
    if (result.status !== 200) return res.status(result.status).json({ status: result.status, error: result.error, ...(result.data ? { data: result.data } : {}) });
    res.cookie("token", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return res.status(200).json({ status: 200, data: "Your account has been deleted." });
  } catch (err) {
    logger.error({ err }, "Account deletion failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
