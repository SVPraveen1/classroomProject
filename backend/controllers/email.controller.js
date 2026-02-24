const emailService = require("../services/email.service");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.sendEmailToStudent = async (req, res, next) => {
  try {
    const { studentId, subject, message } = req.body;

    if (!studentId || !subject || !message) {
      return res
        .status(400)
        .json({ error: "Student ID, subject, and message are required." });
    }

    // Fetch student details
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true, guardianEmail: true, name: true, rollNo: true },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // Fetch teacher name
    const teacher = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    });

    const result = await emailService.sendEmail({
      to: student.email,
      cc: student.guardianEmail || undefined,
      subject,
      message,
      teacherName: teacher?.name,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
