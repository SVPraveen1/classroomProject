const express = require("express");
const authController = require("../controllers/auth.controller");
const { verifyToken, isTeacher } = require("../middleware/auth");

const router = express.Router();

// Register a new user (Student or Teacher)
router.post("/register", authController.register);

// Login User
router.post("/login", authController.login);

// Bulk Register Users
router.post(
  "/bulk-register",
  verifyToken,
  isTeacher,
  authController.bulkRegister,
);

module.exports = router;
