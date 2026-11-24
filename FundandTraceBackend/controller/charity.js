const mongoose = require("mongoose");
const { Charity } = require("../models/charity");
const axios = require("axios");
const logger = require("../utility/logger");

exports.getCharities = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    const charities = await Charity.find();
    return res.status(200).json({
      success: true,
      data: charities,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(200).json({ success: true, data: [] });
  }
};

exports.getCharity = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid Charity ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 503, error: "Service temporarily unavailable. Please try again." });
    }

    const charity = await Charity.findById(id);
    if (!charity) {
      return res.status(404).json({ status: 404, error: "Charity not found" });
    }

    return res.status(200).json({
      success: true,
      data: charity,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error" });
  }
};

// GET /api/charities/charity/checkCharity/:regNo?country=GB|US|NG|KE...
exports.checkCharity = async (req, res, next) => {
  try {
    const { lookupCharity } = require("../services/charityRegistry");
    const result = await lookupCharity(req.query.country || "GB", req.params.regNo);
    // `data` keeps the raw UK payload shape the sign-up form already reads.
    return res.status(200).json({ success: true, data: result.raw, registry: result.registry });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ status: error.status, error: error.message });
    if (error.response?.status === 404) return res.status(404).json({ status: 404, error: "Charity not found" });
    logger.error({ err: error.response?.data || error.message }, "charity lookup failed");
    return res.status(502).json({ status: 502, error: "The charity register is unavailable right now. Please try again." });
  }
};
