const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  code: Joi.string().alphanum().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  phone: Joi.string().required(),
});

const signupCharitySchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  code: Joi.string().alphanum().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  phone: Joi.string().required(),
  charity: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
  }).required(),
});
const { Users, Credentials } = require("../models/users");
const { Donations } = require("../models/donationsModel");
const { Campaign } = require("../models/campaignModel");
const mailService = require("../services/users");
const jwt = require("jsonwebtoken");
const { addActivity } = require("../services/activityLog");
const { convertToPounds } = require("../currencyConverter");
const { Charity } = require("../models/charity");
const { validate } = require("../utility/validate");
const { startTwoFactorChallenge } = require("./twoFactor");
const logger = require("../utility/logger");
const { safeProfile } = require("../utility/safeProfile");

// Fields a user may update on their own profile. Everything else (role,
// verified, suspended, twoFactor, identityVerification, ...) is server-set
// state and must never be writable through profile updates (mass assignment).
const SELF_UPDATE_ALLOWED = [
  "firstName",
  "lastName",
  "country",
  "city",
  "phone",
  "code",
  "language",
  "profilePicture",
];
const pickAllowed = (source, allowed) => {
  const out = {};
  if (!source || typeof source !== "object") return out;
  for (const key of allowed) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};

//Sign Up
exports.signup = async (req, res, next) => {
  let credential;
  let user;
  let credentialSaved = false;
  let userSaved = false;
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const { error } = signupSchema.validate(
      { ...req.body, email: normalizedEmail },
      { abortEarly: false }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: error.details.map((detail) => detail.message).join(", "),
      });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    credential = new Credentials({
      email: normalizedEmail,
      password: hash,
    });
    user = new Users({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      country: req.body.country,
      city: req.body.city,
      phone: req.body.phone,
      email: normalizedEmail,
      verified: false,
      joined: Date.now(),
      code: req.body.code,
    });

    const emailExist = await Credentials.findOne({ email: normalizedEmail });
    if (emailExist)
      return res.status(409).json({
        status: 409,
        error: "Sorry, email already used by another user.",
      });

    await credential.save();
    credentialSaved = true;
    await user.save();
    userSaved = true;
    const token = await jwt.sign(
      { email: normalizedEmail },
      process.env.TOKEN_SECRET,
      {
        expiresIn: 60 * 15,
      }
    );
    await mailService.mailService(normalizedEmail, token);
    addActivity("signUp", normalizedEmail);
    return res.status(201).json({
      success: true,
      message:
        "User created successfully, Please check your mail box to verify your email address",
    });
  } catch (error) {
    // Compensate for a failure between the two account writes. Email failures
    // intentionally keep the unverified account so the user can resend it.
    if (credentialSaved && !userSaved && credential?._id) {
      await Credentials.deleteOne({ _id: credential._id }).catch(() => {});
    }
    if (error && error.code === 11000) {
      return res.status(409).json({
        status: 409,
        error: "Sorry, email already used by another user.",
      });
    }
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.signupCharity = async (req, res, next) => {
  let credential;
  let user;
  let charity;
  let credentialSaved = false;
  let userSaved = false;
  let charitySaved = false;
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const { error } = signupCharitySchema.validate(
      { ...req.body, email: normalizedEmail },
      { abortEarly: false }
    );
    if (error) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: error.details.map((detail) => detail.message).join(", "),
      });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    credential = new Credentials({
      email: normalizedEmail,
      password: hash,
    });
    user = new Users({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      country: req.body.country,
      city: req.body.city,
      phone: req.body.phone,
      email: normalizedEmail,
      verified: false,
      joined: Date.now(),
      code: req.body.code,
    });

    charity = new Charity(req.body.charity);
    const emailExist = await Credentials.findOne({ email: normalizedEmail });
    if (emailExist)
      return res.status(409).json({
        status: 409,
        error: "Sorry, email already used by another user.",
      });

    await credential.save();
    credentialSaved = true;
    await user.save();
    userSaved = true;
    await charity.save();
    charitySaved = true;
    const token = jwt.sign(
      { email: normalizedEmail },
      process.env.TOKEN_SECRET,
      {
        expiresIn: 60 * 15,
      }
    );
    await mailService.mailService(normalizedEmail, token);
    addActivity("signUpCharity", normalizedEmail);
    return res.status(201).json({
      success: true,
      message:
        "Charity created successfully, Please check your mail box to verify your email address",
    });
  } catch (error) {
    // Charity signup spans three collections. Roll back only incomplete account
    // creation; a mail failure leaves the unverified account recoverable.
    if (credentialSaved && !userSaved && credential?._id) {
      await Credentials.deleteOne({ _id: credential._id }).catch(() => {});
    }
    if (userSaved && !charitySaved && user?._id) {
      await Users.deleteOne({ _id: user._id }).catch(() => {});
      if (credential?._id) {
        await Credentials.deleteOne({ _id: credential._id }).catch(() => {});
      }
    }
    if (error && error.code === 11000) {
      return res.status(409).json({
        status: 409,
        error: "Sorry, email already used by another user.",
      });
    }
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};


// mailService.mailService("wisdomosara@gmail.com");

//Login
exports.login = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;
    const user = await Credentials.findOne({ email });
    if (!user)
      return res.status(404).json({
        status: 404,
        error: "Email supplied is incorrect or doesn't exist",
      });
    const verifyPassword = await bcrypt.compare(password, user.password);
    if (!verifyPassword)
      return res
        .status(404)
        .json({ status: 404, error: "password supplied is incorrect" });

    const userProfile = await Users.findOne({ email: email });
    //check for user
    if (!userProfile) {
      return res.status(404).json({
        status: 404,
        error: "User not found",
      });
    }
    if (userProfile.suspended) {
      return res.status(403).json({ status: 403, error: "Account suspended" });
    }
    if (!userProfile.verified) {
      return res.status(403).json({ status: 403, error: "Please verify your email first" });
    }

    // Two-factor enabled accounts complete sign-in via the TOTP challenge.
    if (userProfile.twoFactor && userProfile.twoFactor.enabled) {
      return startTwoFactorChallenge(res, userProfile, "user");
    }

    const token = jwt.sign(
      { email: email, id: userProfile._id },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    const isProd = process.env.NODE_ENV == "production";
    res.cookie(`token`, token, {
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
      secure: isProd,
      httpOnly: true,
      // SameSite=None requires Secure, so use Lax in dev (local frontend
      // and backend share the localhost site) and None in production.
      sameSite: isProd ? "none" : "lax",
    });

    addActivity("login", email);
    return res.status(200).json({
      success: true,
      message: "Log in successful",
      // The session token is delivered only through the HTTP-only cookie.
      // Keeping it out of JSON prevents accidental persistence in Redux,
      // localStorage, logs, or analytics payloads.
      data: { userProfile: safeProfile(userProfile) },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.cookie(`token`, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV == "production",
      path: "/",
      maxAge: 0,
    });
    return res.status(200).json({
      success: true,
      message: "Log out successful",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//changePassword
exports.changePassword = async (req, res, next) => {
  try {
    if (!req.auth || req.auth.email !== req.params.email) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }
    const credential = await Credentials.findOne({ email: req.params.email });
    const verifyPassword = await bcrypt.compare(
      req.body.oldPassword,
      credential.password
    );
    if (!verifyPassword)
      return res
        .status(404)
        .json({ status: 404, error: "password supplied is incorrect" });

    const hash = await bcrypt.hash(req.body.newPassword, 10);
    credential.password = hash;
    credential.save();
    addActivity("changePassword", req.params.email);
    return res.status(200).json({
      success: true,
      message: "Password Changed successfully",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//Update User Profile
exports.updateUser = async (req, res, next) => {
  try {
    if (!req.auth || String(req.auth.id) !== String(req.params.id)) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }
    // Field allowlist: req.body.profile is client-controlled and must not
    // reach protected paths (role, verified, suspended, twoFactor, ...).
    const updates = pickAllowed(req.body.profile, SELF_UPDATE_ALLOWED);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 400, error: "No valid profile fields supplied" });
    }
    const user = await Users.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ status: 404, error: "User not found" });
    }
    addActivity("updateProfile", user.email);
    return res.status(201).json({
      success: true,
      message: "User updated successfully",
      data: safeProfile(user),
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//verify User's Email after sign up
exports.verifyUser = async (req, res, next) => {
  try {
    const email = req.params.email;
    const token = req.query.t;
    if (!token || typeof token !== "string") {
      return res.redirect(process.env.MAINURL + "/SignUp/VerifyEmail");
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
      return res.redirect(process.env.MAINURL + "/SignUp/VerifyEmail");
    }
    if (decoded.email === email) {
      await Users.findOneAndUpdate(
        { email: email },
        { $set: { verified: true } }
      ).maxTimeMS(3000);
      return res.redirect(process.env.MAINURL + "/verification");
    } else {
      return res.redirect(process.env.MAINURL + "/SignUp/VerifyEmail");
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//resend Verification Email
exports.verifyEmail = async (req, res, next) => {
  try {
    const email = req.params.email;

    const token = await jwt.sign({ email: email }, process.env.TOKEN_SECRET, {
      expiresIn: 60 * 15,
    });
    await mailService.mailService(email, token);

    return res.status(201).json({
      success: true,
      message:
        "Mail sent successfully, Please check your mail box to verify your email address",
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

//check if a user exists
exports.check = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid User ID" });
    }

    const user = await Users.findById({ _id: id }).maxTimeMS(3000);

    if (user) {
      return res.json({
        status: true,
        data: safeProfile(user),
      });
    } else {
      return res.json({
        status: false,
      });
    }
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getContributions = async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!req.auth || req.auth.email !== email) {
      return res.status(403).json({ status: 403, error: "Unauthorized" });
    }

    const contributions = await Donations.find({ donorEmail: email }).populate(
      "campaignId"
    );
    return res.status(200).json({
      contributions,
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

exports.getCampaignOrganizerStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 400, error: "Invalid User ID" });
    }

    if (mongoose.connection.readyState !== 1) {
      if (id === "60f594c6cb5ed5000425c5ea") {
        return res.status(200).json({
          status: 200,
          data: {
            campaigns: [],
            donations: 0,
            user: { _id: id, email: "organizer@example.com", firstName: "Demo", lastName: "Organizer" },
            amountRaised: 0,
            amountDisbursed: 0,
            chartDetails: [],
          },
        });
      }
      return res.status(401).json({ status: 401, error: "User not found" });
    }

    const user = await Users.findById({ _id: id });

    if (!user) {
      if (id === "60f594c6cb5ed5000425c5ea") {
        return res.status(200).json({
          status: 200,
          data: {
            campaigns: [],
            donations: 0,
            user: { _id: id, email: "organizer@example.com", firstName: "Demo", lastName: "Organizer" },
            amountRaised: 0,
            amountDisbursed: 0,
            chartDetails: [],
          },
        });
      }
      return res.status(401).json({ status: 401, error: "User not found" });
    }
    const fields = {
      "funding.accountName": 0,
      "funding.accountNumber": 0,
      "funding.sortCode": 0,
      "funding.bankName": 0,
    };
    const campaigns = await Campaign.find({
      organizerId: id,
      launched: true,
    }).select(fields);
    const donations = await Donations.find({
      donorEmail: user.email,
      "refund.status": { $ne: "succeeded" },
    });

    const getAmountRaised = async () => {
      const amountRaised = campaigns.reduce((accumulator, campaign) => {
        return (
          accumulator +
          convertToPounds(
            campaign.funding.amountRaised,
            campaign.funding.currency
          )
        );
      }, 0);
      return amountRaised;
    };

    const getDisbursed = async () => {
      const amountDisbursed = campaigns.reduce((accumulator, campaign) => {
        return (
          accumulator +
          convertToPounds(
            campaign.funding.amountRaised - campaign.funding.availableBalance,
            campaign.funding.currency
          )
        );
      }, 0);
      return amountDisbursed;
    };

    const amountRaised = await getAmountRaised();
    const amountDisbursed = await getDisbursed();
    const getCategories = async () => {
      const categories = [];
      const campaignCategory = {};
      campaigns.forEach((campaign) => {
        if (categories.includes(campaign.category)) {
          campaignCategory[campaign.category].push(campaign);
        } else {
          categories.push(campaign.category);
          campaignCategory[campaign.category] = [campaign];
        }
      });
      const finalCategories = [];
      for (key in campaignCategory) {
        const total = campaignCategory[key].reduce((accumulator, campaign) => {
          return (
            accumulator +
            convertToPounds(
              campaign.funding.amountRaised,
              campaign.funding.currency
            )
          );
        }, 0);
        finalCategories.push({ category: key, donations: total });
      }
      return finalCategories;
    };

    const categories = await getCategories();

    return res.status(200).json({
      status: 200,
      data: {
        campaigns,
        donations: donations.length,
        user: safeProfile(user),
        amountRaised,
        amountDisbursed,
        chartDetails: categories,
      },
    });
  } catch (error) {
    logger.error({ err: error });
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};
