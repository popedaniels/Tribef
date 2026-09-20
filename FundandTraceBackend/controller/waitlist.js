const { Waitlist } = require("../models/waitlistModel");
const { addActivity } = require("../services/activityLog");
const logger = require("../utility/logger");

exports.addEmail = async (req, res, next) => {
  try {
    const email = await Waitlist.findOne({ email: req.params.email });
    if (email) {
      return res.status(422).json({
        success: false,
        error: "Email address already exists",
      });
    } else {
      const waitlist = new Waitlist({
        email: req.params.email,
      });
      await waitlist.save();
      addActivity("waitlist", req.params.email);
      return res.status(201).json({
        success: true,
        message: "Email added successfully",
        data: req.params.email,
      });
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
