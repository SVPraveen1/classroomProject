const { PrismaClient } = require("@prisma/client");
const leaveService = require("./leave.service");
const qrToken = require("../utils/qrToken");

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

    // Auto-mark attendance for approved leave requests covering today + this subject
    await leaveService.autoMarkLeaveForNewSession(
      session.id,
      session.subject,
      session.createdAt,
    );

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

  async issueQrToken(teacherId, sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { teacherId: true, isActive: true },
    });

    if (!session || session.teacherId !== teacherId) {
      const error = new Error("Session not found.");
      error.status = 404;
      throw error;
    }

    if (!session.isActive) {
      const error = new Error("Session has ended.");
      error.status = 410;
      throw error;
    }

    return qrToken.sign(sessionId);
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
      include: {
        student: { select: { name: true, email: true, rollNo: true } },
      },
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
            student: {
              select: { id: true, name: true, email: true, rollNo: true },
            },
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
      select: { id: true, name: true, email: true, rollNo: true },
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
          rollNo: a.student.rollNo,
          scannedAt: a.scannedAt,
          isLeaveApproved: a.isLeaveApproved,
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

  async exportToCSV(teacherId, subjectName) {
    // 1. Fetch all sessions for this teacher and subject
    const subjectCode = subjectName === "General" ? null : subjectName;

    // Prisma query trick: if subjectCode is null, we can query on null, but the schema allows String?
    // Let's rely on exactly what's passed in. Our app usually passes "General" or "some text".
    // Wait, the DB stores "General" instead of null when default is used.
    const sessions = await prisma.session.findMany({
      where: {
        teacherId: teacherId,
        subject: subjectName,
      },
      orderBy: { createdAt: "asc" }, // Ascending so sessions go chronologically left to right
      include: {
        attendances: {
          select: { studentId: true },
        },
      },
    });

    if (sessions.length === 0) {
      const error = new Error("No sessions found for this subject.");
      error.status = 404;
      throw error;
    }

    // 2. Fetch all students
    const allStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, rollNo: true },
      orderBy: { name: "asc" },
    });

    // 3. Build CSV Header
    // "Student Name", "Email", "2023-10-01", "2023-10-05" ...
    const formatDateObj = (date) => {
      const d = new Date(date);
      // Create a short date-time string, e.g., "10/05/2023 14:30"
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    };

    let csvContent = `"Student Name","Email",`;
    const sessionHeaders = sessions.map(
      (s) => `"${formatDateObj(s.createdAt)}"`,
    );
    csvContent += sessionHeaders.join(",") + "\n";

    // 4. Build CSV Rows for each student
    for (const student of allStudents) {
      const row = [`"${student.name}"`, `"${student.email}"`];

      // Check each session if student attended
      for (const session of sessions) {
        const isPresent = session.attendances.some(
          (a) => a.studentId === student.id,
        );
        row.push(isPresent ? `"Present"` : `"Absent"`);
      }

      csvContent += row.join(",") + "\n";
    }

    return csvContent;
  }

  /**
   * Get a student attendance report for the teacher's sessions.
   * Supports optional filters: branchName, subject (groups all sessions of that subject).
   * Returns students with attendance stats + dynamic filter options.
   */
  async getStudentReport(teacherId, { branchName, subject } = {}) {
    // 1. Build session query — filter by subject name if provided
    const sessionWhere = { teacherId };
    if (subject) sessionWhere.subject = subject;

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        attendances: {
          select: { studentId: true },
        },
      },
    });

    // 2. Build student query
    const studentWhere = { role: "STUDENT" };
    if (branchName) studentWhere.branchName = branchName;

    const students = await prisma.user.findMany({
      where: studentWhere,
      select: {
        id: true,
        rollNo: true,
        name: true,
        email: true,
        guardianEmail: true,
        branchName: true,
        createdAt: true,
      },
      orderBy: { rollNo: "asc" },
    });

    // 3. Compute attendance for each student across filtered sessions
    //    Only count sessions created on or after the student's registration date
    const totalSessions = sessions.length;

    // Find the earliest session date to determine late registration
    const earliestSessionDate =
      sessions.length > 0
        ? new Date(
            Math.min(...sessions.map((s) => new Date(s.createdAt).getTime())),
          )
        : null;

    const studentReport = students.map((student) => {
      const studentCreatedAt = new Date(student.createdAt);

      // Filter sessions to only those on or after the student's registration
      const eligibleSessions = sessions.filter(
        (s) => new Date(s.createdAt) >= studentCreatedAt,
      );
      const eligibleCount = eligibleSessions.length;

      let presentCount = 0;
      eligibleSessions.forEach((session) => {
        if (session.attendances.some((a) => a.studentId === student.id)) {
          presentCount++;
        }
      });

      // Student is "late registered" if their account was created after the first session
      const isLateRegistered =
        earliestSessionDate && studentCreatedAt > earliestSessionDate;

      return {
        id: student.id,
        rollNo: student.rollNo,
        email: student.email,
        guardianEmail: student.guardianEmail,
        totalSessions: eligibleCount,
        presentCount,
        absentCount: eligibleCount - presentCount,
        percentage:
          eligibleCount > 0
            ? Math.round((presentCount / eligibleCount) * 100)
            : 0,
        isLateRegistered: !!isLateRegistered,
      };
    });

    // 4. Fetch dynamic filter options
    const allBranches = await prisma.user.findMany({
      where: { role: "STUDENT", branchName: { not: null } },
      select: { branchName: true },
      distinct: ["branchName"],
      orderBy: { branchName: "asc" },
    });

    // Group sessions by subject with count
    const allTeacherSessions = await prisma.session.findMany({
      where: { teacherId },
      select: { subject: true },
    });

    const subjectCounts = {};
    allTeacherSessions.forEach((s) => {
      subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
    });

    const subjects = Object.entries(subjectCounts).map(([name, count]) => ({
      name,
      sessionCount: count,
      label: `${name} — ${count} ${count === 1 ? "class" : "classes"}`,
    }));

    return {
      students: studentReport,
      totalSessions,
      totalStudents: students.length,
      filters: {
        branches: allBranches.map((b) => b.branchName),
        subjects,
      },
    };
  }
}

module.exports = new SessionService();
