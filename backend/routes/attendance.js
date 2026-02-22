const express = require("express");
const { verifyToken, isStudent } = require("../middleware/auth");
const attendanceController = require("../controllers/attendance.controller");

const router = express.Router();

// Mark attendance
router.post(
  "/mark",
  verifyToken,
  isStudent,
  attendanceController.markAttendance,
);

// Student: Get their own attendance history across all sessions grouped by subject
router.get(
  "/history",
  verifyToken,
  isStudent,
  attendanceController.getAttendanceHistory,
);

module.exports = router;
