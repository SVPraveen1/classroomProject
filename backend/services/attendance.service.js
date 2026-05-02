const { PrismaClient } = require("@prisma/client");
const { calculateDistance } = require("../utils/geolocation");
const qrToken = require("../utils/qrToken");

const prisma = new PrismaClient();

class AttendanceService {
  async markAttendance(
    studentId,
    { qrToken: token, latitude, longitude, deviceFingerprint },
  ) {
    if (!token || latitude === undefined || longitude === undefined) {
      const error = new Error("Missing required QR token or location data");
      error.status = 400;
      throw error;
    }

    const { sessionId, issuedAt } = qrToken.verify(token);

    // Find the active session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      const error = new Error("Session not found or has already ended");
      error.status = 404;
      throw error;
    }

    // Check if attendance already marked by this student
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_studentId: { sessionId, studentId: studentId },
      },
    });

    if (existingAttendance) {
      const error = new Error("Attendance already marked for this session");
      error.status = 400;
      throw error;
    }

    // Device fingerprint check — prevent same device from marking for multiple students
    if (deviceFingerprint) {
      const deviceAlreadyUsed = await prisma.attendance.findFirst({
        where: {
          sessionId,
          deviceFingerprint,
          studentId: { not: studentId }, // different student, same device
        },
      });

      if (deviceAlreadyUsed) {
        const error = new Error(
          "Attendance has already been marked from this device for another student. One device can only be used once per session.",
        );
        error.status = 403;
        throw error;
      }
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
      const error = new Error(
        "You are too far from the classroom to mark attendance.",
      );
      error.status = 403;
      error.distance = Math.round(distanceMeters);
      throw error;
    }

    try {
      // Insert attendance record with device fingerprint and QR token timestamp
      const attendance = await prisma.attendance.create({
        data: {
          sessionId,
          studentId: studentId,
          distanceMeters,
          deviceFingerprint: deviceFingerprint || null,
          qrTimestamp: BigInt(issuedAt),
        },
      });

      return {
        message: "Attendance marked successfully",
        distanceMeters,
      };
    } catch (dbError) {
      if (dbError.code === "P2002") {
        const error = new Error("Attendance already marked");
        error.status = 400;
        throw error;
      }
      throw dbError;
    }
  }

  async getAttendanceHistory(studentId) {
    // Get the student's registration date
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { createdAt: true },
    });

    // Only fetch sessions created on or after the student's registration date
    const allSessions = await prisma.session.findMany({
      where: { createdAt: { gte: student.createdAt } },
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true } },
      },
    });

    // Get sessions where this student was present
    const myAttendances = await prisma.attendance.findMany({
      where: { studentId: studentId },
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

    return { subjects };
  }
}

module.exports = new AttendanceService();
