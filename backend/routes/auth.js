const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Register a new user (Student or Teacher)
router.post("/register", authController.register);

// Login User
router.post("/login", authController.login);

module.exports = router;
