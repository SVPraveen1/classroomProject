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

// Issue a short-lived signed QR token for the teacher's active session
router.get(
  "/:sessionId/qr-token",
  verifyToken,
  isTeacher,
  sessionController.issueQrToken,
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

// Export attendance for a specific subject to CSV
router.get(
  "/export/:subjectName",
  verifyToken,
  isTeacher,
  sessionController.exportSubjectCSV,
);

// Get student attendance report with optional filters (branch, session)
router.get(
  "/student-report",
  verifyToken,
  isTeacher,
  sessionController.getStudentReport,
);

module.exports = router;
