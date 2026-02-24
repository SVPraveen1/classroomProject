const express = require("express");
const { verifyToken, isTeacher } = require("../middleware/auth");
const emailController = require("../controllers/email.controller");

const router = express.Router();

// Teacher sends a custom email to a student
router.post(
  "/send",
  verifyToken,
  isTeacher,
  emailController.sendEmailToStudent,
);

module.exports = router;
