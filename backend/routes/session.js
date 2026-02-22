const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { verifyToken, isTeacher } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Teacher starts a new session (Provides their geolocation + subject)
router.post("/start", verifyToken, isTeacher, async (req, res) => {
  try {
    const { latitude, longitude, subject } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required." });
    }

    // Deactivate previous active sessions for this teacher to prevent overlaps
    await prisma.session.updateMany({
      where: { teacherId: req.user.id, isActive: true },
      data: { isActive: false },
    });

    // Create the new session
    const session = await prisma.session.create({
      data: {
        teacherId: req.user.id,
        subject: subject || "General",
        latitude,
        longitude,
        isActive: true,
      },
    });

    res.status(201).json({
      message: "Session started successfully",
      sessionId: session.id,
      session,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// Teacher ends the session
router.post("/end", verifyToken, isTeacher, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Validate session belongs to this teacher
    await prisma.session.update({
      where: { id: sessionId, teacherId: req.user.id },
      data: { isActive: false },
    });

    res.json({ message: "Session ended successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Get the active session for the teacher
router.get("/active", verifyToken, isTeacher, async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { teacherId: req.user.id, isActive: true },
    });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: "Error fetching session" });
  }
});

// Get all attendance records for a specific session
router.get(
  "/:sessionId/attendance",
  verifyToken,
  isTeacher,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const attendees = await prisma.attendance.findMany({
        where: { sessionId },
        include: { student: { select: { name: true, email: true } } },
      });
      res.json({ attendees });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendees" });
    }
  },
);

// Get all past sessions for a teacher (Session History) grouped by subject
router.get("/history", verifyToken, isTeacher, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { teacherId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { attendances: true } },
        attendances: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Get total number of students (to show total enrolled students)
    const totalStudents = await prisma.user.count({
      where: { role: "STUDENT" },
    });

    // Get all students for the override list
    const allStudentsList = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
    });

    // Group by subject
    const subjectsMap = {};

    sessions.forEach((session) => {
      const sub = session.subject || "General";
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          subject: sub,
          totalSessions: 0,
          totalStudents: totalStudents, // Assuming all students are enrolled for the demo
          sessions: [],
        };
      }
      subjectsMap[sub].totalSessions++;
      subjectsMap[sub].sessions.push({
        id: session.id,
        date: session.createdAt,
        attendedCount: session._count.attendances,
        isActive: session.isActive,
        attendees: session.attendances.map((a) => ({
          id: a.student.id,
          name: a.student.name,
          email: a.student.email,
          scannedAt: a.scannedAt,
        })),
      });
    });

    const subjectData = Object.values(subjectsMap);

    res.json({ subjects: subjectData, allStudents: allStudentsList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch session history" });
  }
});

// Teacher manually overrides student attendance for a session
router.post("/override", verifyToken, isTeacher, async (req, res) => {
  try {
    const { sessionId, studentId, status } = req.body; // status: "PRESENT" or "ABSENT"

    if (!sessionId || !studentId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify session belongs to teacher
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.teacherId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Unauthorized or session not found" });
    }

    if (status === "PRESENT") {
      // Create attendance record if it doesn't already exist
      await prisma.attendance.upsert({
        where: {
          sessionId_studentId: { sessionId, studentId },
        },
        update: {},
        create: {
          sessionId,
          studentId,
          distanceMeters: 0, // Manual override => 0 distance
        },
      });
    } else if (status === "ABSENT") {
      // Delete attendance record if it exists
      try {
        await prisma.attendance.delete({
          where: {
            sessionId_studentId: { sessionId, studentId },
          },
        });
      } catch (e) {
        // Record might not exist, ignore Error: P2025
        if (e.code !== "P2025") throw e;
      }
    }

    res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update attendance" });
  }
});

module.exports = router;
