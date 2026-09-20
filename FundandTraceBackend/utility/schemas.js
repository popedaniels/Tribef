const Joi = require("joi");

const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  code: Joi.string().alphanum().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  phone: Joi.string().required(),
});

const signupCharitySchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  code: Joi.string().alphanum().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  phone: Joi.string().required(),
  charity: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow("", null),
  }).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const addCommentSchema = Joi.object({
  name: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  comment: Joi.string().min(1).max(2000).required(),
  amount: Joi.number().min(0).optional(),
});

const addUpdateSchema = Joi.object({
  story: Joi.string().min(1).required(),
  image: Joi.string().allow("", null).optional(),
  video: Joi.string().allow("", null).optional(),
  addedBy: Joi.string().allow("", null).optional(),
});

const disputeSchema = Joi.object({
  disputeCategory: Joi.string()
    .valid(
      "Fake Evidence / Altered Receipt",
      "Misappropriation of Funds",
      "Inactive / Abandoned Milestone",
      "Identity Mismatch",
      "Other"
    )
    .required(),
  description: Joi.string().min(10).max(3000).required(),
  evidenceAttachmentUrl: Joi.string().uri().allow("", null).optional(),
  donationId: Joi.string().allow("", null).optional(),
});

const createFundingRequestSchema = Joi.object({
  campaignId: Joi.string().required(),
  organizerId: Joi.string().optional(),
  fundingType: Joi.string().allow("", null).optional(),
  currency: Joi.string().default("USD").optional(),
  amount: Joi.number().positive().required(),
  purposeOfFunding: Joi.string().min(5).required(),
  proofOfFunding: Joi.string().allow("", null).optional(),
  thirdPartyAccountNumber: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  thirdPartyAccountName: Joi.string().allow("", null).optional(),
  thirdPartyBankName: Joi.string().allow("", null).optional(),
  thirdPartyNameOfRef: Joi.string().allow("", null).optional(),
  thirdPartyContact: Joi.string().allow("", null).optional(),
  vendorDisbursement: Joi.object().optional(),
  mobileFieldVerification: Joi.object().optional(),
});

const basicInfoSchema = Joi.object({
  campaignId: Joi.string().required(),
  campaignTitle: Joi.string().min(3).max(150).required(),
  campaignTagline: Joi.string().max(250).allow("", null).optional(),
  campaignImage: Joi.string().allow("", null).optional(),
  duration: Joi.number().min(1).max(365).optional(),
  locationCountry: Joi.string().allow("", null).optional(),
  locationState: Joi.string().allow("", null).optional(),
});

module.exports = {
  signupSchema,
  signupCharitySchema,
  loginSchema,
  addCommentSchema,
  addUpdateSchema,
  disputeSchema,
  createFundingRequestSchema,
  basicInfoSchema,
};
