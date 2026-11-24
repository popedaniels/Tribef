const Joi = require("joi");
const mongoose = require("mongoose");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      status: 400,
      error: details.join(", "),
    });
  }
  next();
};

// `router.param()` handler that rejects malformed MongoDB ObjectIds with a 400
// before any controller runs. Without it, a bad or empty id either reaches
// Mongoose and surfaces as a 500 "Server error", or — for routers that also
// declare a catch-all `/:id` — is silently matched by the wrong handler.
//
// Usage:  router.param("id", objectIdParam("Campaign ID"));
const objectIdParam = (label = "ID") => (req, res, next, value) => {
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value)) {
    return next();
  }
  return res.status(400).json({
    success: false,
    status: 400,
    error: `Invalid ${label}`,
  });
};

module.exports = { validate, objectIdParam };
