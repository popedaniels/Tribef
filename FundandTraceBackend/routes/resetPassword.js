const express = require("express");
const router = express.Router();

const resetPasswordController = require("../controller/resetPassword");

router.post("/", resetPasswordController.resetPassword);
router.post("/sendResetMail/:email", resetPasswordController.verifyEmail);
router.get("/VerifyUser", resetPasswordController.verifyUser);

module.exports = router;
