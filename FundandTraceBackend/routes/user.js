const express = require("express");
const router = express.Router();

const userController = require("../controller/user");
const { requireAuth } = require("../utility/auth");

router.post("/signup", userController.signup);
router.post("/signup/charity", userController.signupCharity);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/checkExists/:id", userController.check);
router.get("/signup/verifyUser/:email", userController.verifyUser);
router.post("/signup/verifyEmail/:email", userController.verifyEmail);
router.post("/updateProfile/:id", requireAuth, userController.updateUser);
router.post("/changePassword/:email", requireAuth, userController.changePassword);
router.get("/contributions/:email", requireAuth, userController.getContributions);
router.get("/campaignOrganizer/:id", userController.getCampaignOrganizerStats);

module.exports = router;
