const bcrypt = require("bcrypt");
const { Users, Credentials } = require("../models/users");
const mailService = require("../services/resetPassword");
const jwt = require("jsonwebtoken");
const { addActivity } = require("../services/activityLog");
const logger = require("../utility/logger");

const getResetSecret = () => process.env.RESET_TOKEN_SECRET || process.env.TOKEN_SECRET;

//Verify the email and send a mail for resetting
exports.verifyEmail = async (req, res, next) => {
  try {
    const email = req.params.email;

    const user = await Users.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "Email doesn't exist",
      });
    }
    const resetSecret = getResetSecret();
    if (!resetSecret || resetSecret.length < 32) {
      return res.status(503).json({ status: 503, error: "Password reset is not configured" });
    }
    const token = jwt.sign({ email }, resetSecret, { expiresIn: "15m" });
    await mailService.resetPasswordMailService(email, token);
    return res.status(201).json({
      success: true,
      message: "Please Check your mail for link",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//Verify the token on the mail
exports.verifyUser = async (req, res, next) => {
  try {
    const email = req.query.email;
    const token = req.query.t;
    const resetSecret = getResetSecret();
    if (!token || typeof token !== "string") {
      return res.redirect(process.env.MAINURL + "/ForgotPassword?status=expired");
    }
    let decoded;
    try {
      decoded = jwt.verify(token, resetSecret);
    } catch (err) {
      return res.redirect(process.env.MAINURL + "/ForgotPassword?status=expired");
    }
    if (decoded.email === email) {
      return res.redirect(
        `${process.env.MAINURL}/ForgotPassword/CreatePassword?email=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`
      );
    } else {
      return res.redirect(process.env.MAINURL + "/ForgotPassword?status=wrongEmail");
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//handles the password reset
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, password, token } = req.body;
    const resetSecret = getResetSecret();
    if (!resetSecret || resetSecret.length < 32 || !email || !token) {
      return res.status(400).json({ status: 400, error: "Invalid reset request" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, resetSecret);
    } catch (error) {
      return res.status(400).json({ status: 400, error: "Reset link expired or invalid" });
    }
    if (decoded.email !== email || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ status: 400, error: "Invalid reset request" });
    }

    const credential = await Credentials.findOne({ email });
    if (!credential) {
      return res.status(404).json({ status: 404, error: "User not found" });
    }
    const hash = await bcrypt.hash(password, 10);
    credential.password = hash;
    await credential.save();
    addActivity("resetPassword", email);
    return res.status(201).json({
      success: true,
      message: "Password changed Successfully!",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
