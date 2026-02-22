const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class SessionService {
  async startSession(teacherId, { latitude, longitude, subject }) {
    if (!latitude || !longitude) {
      const error = new Error("Latitude and longitude are required.");
      error.status = 400;
      throw error;
    }

    // Deactivate previous active sessions for this teacher to prevent overlaps
    await prisma.session.updateMany({
      where: { teacherId: teacherId, isActive: true },
      data: { isActive: false },
    });

    // Create the new session
    const session = await prisma.session.create({
      data: {
        teacherId: teacherId,
        subject: subject || "General",
        latitude,
        longitude,
        isActive: true,
      },
    });

    return {
      message: "Session started successfully",
      sessionId: session.id,
      session,
    };
  }

  async endSession(teacherId, sessionId) {
    // Validate session belongs to this teacher
    await prisma.session.update({
      where: { id: sessionId, teacherId: teacherId },
      data: { isActive: false },
    });

    return { message: "Session ended successfully" };
  }

  async getActiveSession(teacherId) {
    const session = await prisma.session.findFirst({
      where: { teacherId: teacherId, isActive: true },
    });
    return { session };
  }

  async getSessionAttendees(sessionId) {
    const attendees = await prisma.attendance.findMany({
      where: { sessionId },
      include: { student: { select: { name: true, email: true } } },
    });
    return { attendees };
  }

  async getSessionHistory(teacherId) {
    const sessions = await prisma.session.findMany({
      where: { teacherId: teacherId },
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
          totalStudents: totalStudents,
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

    return {
      subjects: Object.values(subjectsMap),
      allStudents: allStudentsList,
    };
  }

  async overrideAttendance(teacherId, { sessionId, studentId, status }) {
    if (!sessionId || !studentId || !status) {
      const error = new Error("Missing required fields");
      error.status = 400;
      throw error;
    }

    // Verify session belongs to teacher
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.teacherId !== teacherId) {
      const error = new Error("Unauthorized or session not found");
      error.status = 403;
      throw error;
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
    } else {
      const error = new Error("Invalid status");
      error.status = 400;
      throw error;
    }

    return { message: "Attendance updated successfully" };
  }
}

module.exports = new SessionService();
