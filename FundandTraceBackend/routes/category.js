const express = require("express");
const router = express.Router();

const categoryController = require("../controller/category");

router.post("/create", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/category/:category", categoryController.getSingleCategory);

module.exports = router;
