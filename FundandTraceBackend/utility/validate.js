const Joi = require("joi");

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

module.exports = { validate };