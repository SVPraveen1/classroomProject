const express = require("express");
const { verifyToken, isTeacher, isStudent } = require("../middleware/auth");
const leaveController = require("../controllers/leave.controller");

const router = express.Router();

// ───────── STUDENT ROUTES ─────────
// Request leave for a specific past session
router.post(
  "/request/session",
  verifyToken,
  isStudent,
  leaveController.requestLeaveForSession,
);

// Request leave for a future date (no session exists yet)
router.post(
  "/request/future",
  verifyToken,
  isStudent,
  leaveController.requestLeaveForFutureDate,
);

// Get student's own leave requests
router.get(
  "/my-requests",
  verifyToken,
  isStudent,
  leaveController.getStudentLeaveRequests,
);

// Cancel a pending leave request
router.delete(
  "/:requestId",
  verifyToken,
  isStudent,
  leaveController.cancelLeaveRequest,
);

// ───────── TEACHER ROUTES ─────────
// Get all pending leave requests for teacher's subjects
router.get(
  "/pending",
  verifyToken,
  isTeacher,
  leaveController.getTeacherPendingRequests,
);

// Get leave requests for a specific session
router.get(
  "/session/:sessionId",
  verifyToken,
  isTeacher,
  leaveController.getSessionLeaveRequests,
);

// Approve or reject a leave request
router.post(
  "/:requestId/review",
  verifyToken,
  isTeacher,
  leaveController.reviewLeaveRequest,
);

module.exports = router;
