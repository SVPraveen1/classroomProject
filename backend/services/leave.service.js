const { PrismaClient } = require("@prisma/client");
const emailService = require("./email.service");

const prisma = new PrismaClient();

class LeaveService {
  /**
   * Student requests leave for a specific past session
   * @param {number} studentId
   * @param {Object} data - { sessionId, reason }
   */
  async requestLeaveForSession(studentId, { sessionId, reason }) {
    if (!sessionId || !reason?.trim()) {
      const error = new Error("Session ID and reason are required.");
      error.status = 400;
      throw error;
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { subject: true, teacherId: true },
    });

    if (!session) {
      const error = new Error("Session not found.");
      error.status = 404;
      throw error;
    }

    // Check if already requested for this session
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: { studentId, sessionId, status: "PENDING" },
    });

    if (existingRequest) {
      const error = new Error(
        "You already have a pending leave request for this session.",
      );
      error.status = 400;
      throw error;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        studentId,
        sessionId,
        subject: session.subject,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        student: { select: { name: true, rollNo: true, email: true } },
        session: {
          select: {
            subject: true,
            createdAt: true,
            teacher: { select: { name: true } },
          },
        },
      },
    });

    return {
      message: "Leave request submitted successfully.",
      leaveRequest,
    };
  }

  /**
   * Student requests leave for a future date (when session doesn't exist yet)
   * @param {number} studentId
   * @param {Object} data - { subject, leaveDate, reason }
   */
  async requestLeaveForFutureDate(studentId, { subject, leaveDate, reason }) {
    if (!subject?.trim() || !leaveDate || !reason?.trim()) {
      const error = new Error("Subject, date, and reason are required.");
      error.status = 400;
      throw error;
    }

    const parsedDate = new Date(leaveDate);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error("Invalid date format.");
      error.status = 400;
      throw error;
    }

    // Check if already requested for this date + subject
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        studentId,
        subject: subject.trim(),
        leaveDate: parsedDate,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      const error = new Error(
        "You already have a pending leave request for this date and subject.",
      );
      error.status = 400;
      throw error;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        studentId,
        subject: subject.trim(),
        leaveDate: parsedDate,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        student: { select: { name: true, rollNo: true, email: true } },
      },
    });

    return {
      message: "Leave request submitted successfully.",
      leaveRequest,
    };
  }

  /**
   * Get all leave requests for a student
   * @param {number} studentId
   */
  async getStudentLeaveRequests(studentId) {
    const requests = await prisma.leaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        session: {
          select: {
            id: true,
            subject: true,
            createdAt: true,
            teacher: { select: { name: true } },
          },
        },
        reviewer: { select: { name: true } },
      },
    });

    return { requests };
  }

  /**
   * Get pending leave requests for a teacher (across all their subjects)
   * @param {number} teacherId
   */
  async getTeacherPendingRequests(teacherId) {
    // Get all sessions by this teacher
    const teacherSessions = await prisma.session.findMany({
      where: { teacherId },
      select: { id: true, subject: true },
    });

    const sessionIds = teacherSessions.map((s) => s.id);
    const subjects = [...new Set(teacherSessions.map((s) => s.subject))];

    // Get leave requests for these sessions OR for these subjects (future date requests)
    const requests = await prisma.leaveRequest.findMany({
      where: {
        status: "PENDING",
        OR: [
          { sessionId: { in: sessionIds } },
          { subject: { in: subjects }, sessionId: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            email: true,
            guardianEmail: true,
          },
        },
        session: {
          select: { id: true, subject: true, createdAt: true },
        },
      },
    });

    return { requests };
  }

  /**
   * Get leave requests for a specific session
   * @param {string} sessionId
   */
  async getSessionLeaveRequests(sessionId) {
    const requests = await prisma.leaveRequest.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            email: true,
          },
        },
        reviewer: { select: { name: true } },
      },
    });

    return { requests };
  }

  /**
   * Approve or reject a leave request
   * @param {number} requestId
   * @param {number} reviewerId (teacher ID)
   * @param {Object} data - { status: 'APPROVED' | 'REJECTED', reviewComment? }
   */
  async reviewLeaveRequest(requestId, reviewerId, { status, reviewComment }) {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      const error = new Error('Status must be either "APPROVED" or "REJECTED".');
      error.status = 400;
      throw error;
    }

    // Fetch the request and reviewer info
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            guardianEmail: true,
          },
        },
        session: { select: { id: true, subject: true, createdAt: true } },
      },
    });

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true },
    });

    if (!request) {
      const error = new Error("Leave request not found.");
      error.status = 404;
      throw error;
    }

    // Update the request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComment: reviewComment?.trim() || null,
      },
    });

    // If approved, mark attendance
    if (status === "APPROVED") {
      await this._markAttendanceForApprovedLeave(request);
    }

    // If rejected, remove attendance if it was previously approved
    if (status === "REJECTED" && request.status === "APPROVED") {
      await this._removeAttendanceForRejectedLeave(request);
    }

    // Send email notification to student (+ guardian CC)
    const leaveDate = request.session?.createdAt || request.leaveDate;
    await emailService.sendLeaveStatusNotification(
      request.student,
      status,
      {
        subject: request.subject,
        date: leaveDate,
        reason: request.reason,
        reviewComment,
        reviewerName: reviewer?.name,
      },
    );

    return {
      message: `Leave request ${status.toLowerCase()} successfully.`,
      request: updatedRequest,
      student: request.student,
    };
  }

  /**
   * Internal: Mark attendance when leave is approved
   */
  async _markAttendanceForApprovedLeave(request) {
    if (request.sessionId) {
      // Specific session request
      await prisma.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: request.sessionId,
            studentId: request.studentId,
          },
        },
        update: {
          isLeaveApproved: true,
          distanceMeters: -1,
        },
        create: {
          sessionId: request.sessionId,
          studentId: request.studentId,
          isLeaveApproved: true,
          distanceMeters: -1,
        },
      });
    } else if (request.leaveDate) {
      // Future date request — find matching sessions on that date
      const startOfDay = new Date(request.leaveDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(request.leaveDate);
      endOfDay.setHours(23, 59, 59, 999);

      const matchingSessions = await prisma.session.findMany({
        where: {
          subject: request.subject,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { id: true },
      });

      for (const session of matchingSessions) {
        await prisma.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: request.studentId,
            },
          },
          update: {
            isLeaveApproved: true,
            distanceMeters: -1,
          },
          create: {
            sessionId: session.id,
            studentId: request.studentId,
            isLeaveApproved: true,
            distanceMeters: -1,
          },
        });
      }
    }
  }

  /**
   * Internal: Remove attendance when leave is rejected (after being approved)
   */
  async _removeAttendanceForRejectedLeave(request) {
    if (request.sessionId) {
      // Only delete if it was leave-approved (don't delete GPS-scanned attendance)
      await prisma.attendance.deleteMany({
        where: {
          sessionId: request.sessionId,
          studentId: request.studentId,
          isLeaveApproved: true,
        },
      });
    } else if (request.leaveDate) {
      const startOfDay = new Date(request.leaveDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(request.leaveDate);
      endOfDay.setHours(23, 59, 59, 999);

      const matchingSessions = await prisma.session.findMany({
        where: {
          subject: request.subject,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { id: true },
      });

      for (const session of matchingSessions) {
        await prisma.attendance.deleteMany({
          where: {
            sessionId: session.id,
            studentId: request.studentId,
            isLeaveApproved: true,
          },
        });
      }
    }
  }

  /**
   * Delete a pending leave request (student cancels their own request)
   * @param {number} requestId
   * @param {number} studentId
   */
  async cancelLeaveRequest(requestId, studentId) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      const error = new Error("Leave request not found.");
      error.status = 404;
      throw error;
    }

    if (request.studentId !== studentId) {
      const error = new Error("Unauthorized.");
      error.status = 403;
      throw error;
    }

    if (request.status !== "PENDING") {
      const error = new Error(
        "Cannot cancel a request that has already been reviewed.",
      );
      error.status = 400;
      throw error;
    }

    await prisma.leaveRequest.delete({
      where: { id: requestId },
    });

    return { message: "Leave request cancelled successfully." };
  }

  /**
   * Auto-mark attendance for approved future-date leave requests when session is created
   * Called by session.service when a new session is created
   * @param {string} sessionId
   * @param {string} subject
   * @param {Date} sessionDate
   */
  async autoMarkLeaveForNewSession(sessionId, subject, sessionDate) {
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all approved leave requests for this subject and date
    const approvedRequests = await prisma.leaveRequest.findMany({
      where: {
        subject,
        leaveDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "APPROVED",
        sessionId: null, // Only future-date requests
      },
      select: { studentId: true },
    });

    // Mark attendance for these students
    for (const req of approvedRequests) {
      await prisma.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: req.studentId,
          },
        },
        update: {
          isLeaveApproved: true,
          distanceMeters: -1,
        },
        create: {
          sessionId,
          studentId: req.studentId,
          isLeaveApproved: true,
          distanceMeters: -1,
        },
      });
    }
  }
}

module.exports = new LeaveService();
