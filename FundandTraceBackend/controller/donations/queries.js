// Donor-facing donation history queries.
const { Donations, logger } = require("./shared");

exports.getDonations = async (req, res, next) => {
  try {
    if (!req.auth || req.auth.email !== req.params.email) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }
    const donations = await Donations.find({ donorEmail: req.params.email });
    return res.status(200).json({
      data: donations,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
