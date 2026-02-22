const express = require("express");
const { verifyToken, isTeacher } = require("../middleware/auth");
const sessionController = require("../controllers/session.controller");

const router = express.Router();

// Teacher starts a new session (Provides their geolocation + subject)
router.post("/start", verifyToken, isTeacher, sessionController.startSession);

// Teacher ends the session
router.post("/end", verifyToken, isTeacher, sessionController.endSession);

// Get the active session for the teacher
router.get(
  "/active",
  verifyToken,
  isTeacher,
  sessionController.getActiveSession,
);

// Get all attendance records for a specific session
router.get(
  "/:sessionId/attendance",
  verifyToken,
  isTeacher,
  sessionController.getSessionAttendees,
);

// Get all past sessions for a teacher (Session History) grouped by subject
router.get(
  "/history",
  verifyToken,
  isTeacher,
  sessionController.getSessionHistory,
);

// Teacher manually overrides student attendance for a session
router.post(
  "/override",
  verifyToken,
  isTeacher,
  sessionController.overrideAttendance,
);

module.exports = router;
