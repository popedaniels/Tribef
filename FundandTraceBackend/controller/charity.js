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
      return res.status(500).json({ status: 500, error: "Invalid Charity ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(401).json({ status: 401, error: "Charity not found" });
    }

    const charity = await Charity.findById(id);
    if (!charity) {
      return res.status(401).json({ status: 401, error: "Charity not found" });
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

exports.checkCharity = async (req, res, next) => {
  try {
    const config = {
      headers: {
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": process.env.CHARITIES_API,
        "no-cors": true,
      },
    };
    const { regNo } = req.params;
    const charity = await axios.get(
      `https://api.charitycommission.gov.uk/register/api/allcharitydetails/${regNo}/${0}`,
      config
    );
    if (!charity) {
      return res.status(401).json({ status: 401, error: "Charity not found" });
    }

    return res.status(200).json({
      success: true,
      data: charity.data,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error" });
  }
};
