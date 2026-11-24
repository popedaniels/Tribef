const express = require("express");
const router = express.Router();

const categoryController = require("../controller/category");
const { requireAdmin } = require("../utility/auth");

// Seeds a category document. Was unauthenticated, letting anyone insert
// duplicate categories on every call; admin-only now.
router.post("/create", requireAdmin, categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/category/:category", categoryController.getSingleCategory);

module.exports = router;
