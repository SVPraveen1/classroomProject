const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { verifyToken, isStudent } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Mark attendance
router.post("/mark", verifyToken, isStudent, async (req, res) => {
  try {
    const { sessionId, latitude, longitude } = req.body;

    if (!sessionId || !latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Missing required session ID or location data" });
    }

    // Find the active session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      return res
        .status(404)
        .json({ error: "Session not found or has already ended" });
    }

    // Check if attendance already marked
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_studentId: { sessionId, studentId: req.user.id },
      },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ error: "Attendance already marked for this session" });
    }

    // Calculate distance using Haversine formula
    const distanceMeters = calculateDistance(
      session.latitude,
      session.longitude,
      latitude,
      longitude,
    );

    // 200-meter radius to accommodate Wi-Fi geolocation inaccuracies on laptops/desktops
    if (distanceMeters > 200) {
      return res.status(403).json({
        error: "Location validation failed",
        message: "You are too far from the classroom to mark attendance.",
        distance: Math.round(distanceMeters),
      });
    }

    // Insert attendance record
    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        studentId: req.user.id,
        distanceMeters,
      },
    });

    res
      .status(201)
      .json({ message: "Attendance marked successfully", distanceMeters });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Attendance already marked" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// Student: Get their own attendance history across all sessions grouped by subject
router.get("/history", verifyToken, isStudent, async (req, res) => {
  try {
    // Get all sessions (created by any teacher)
    const allSessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true } },
      },
    });

    // Get sessions where this student was present
    const myAttendances = await prisma.attendance.findMany({
      where: { studentId: req.user.id },
      select: { sessionId: true, scannedAt: true, distanceMeters: true },
    });

    // Build a set of attended session IDs for quick lookup
    const attendedMap = {};
    myAttendances.forEach((a) => {
      attendedMap[a.sessionId] = {
        scannedAt: a.scannedAt,
        distance: a.distanceMeters,
      };
    });

    const subjectsMap = {};

    allSessions.forEach((session) => {
      const sub = session.subject || "General";
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          subject: sub,
          teacherName: session.teacher.name,
          totalClasses: 0,
          attended: 0,
          absent: 0,
          sessions: [],
        };
      }

      subjectsMap[sub].totalClasses++;

      const isPresent = attendedMap[session.id] ? true : false;

      if (isPresent) {
        subjectsMap[sub].attended++;
      }

      subjectsMap[sub].sessions.push({
        sessionId: session.id,
        date: session.createdAt,
        status: isPresent ? "PRESENT" : session.isActive ? "ONGOING" : "ABSENT",
        teacherName: session.teacher.name,
        scannedAt: attendedMap[session.id]?.scannedAt || null,
        distance: attendedMap[session.id]?.distance || null,
      });
    });

    const subjects = Object.values(subjectsMap).map((sub) => {
      // "If no attendance record exists for a session, mark it as Absent."
      sub.absent = sub.sessions.filter((s) => s.status === "ABSENT").length;

      // Calculate percentage based on attended / (attended + absent) -- ignoring ONGOING for percentage
      const completedClasses = sub.attended + sub.absent;
      sub.percentage =
        completedClasses > 0
          ? Math.round((sub.attended / completedClasses) * 100)
          : 0;

      return sub;
    });

    res.json({ subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

module.exports = router;
