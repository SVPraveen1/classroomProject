const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validateStudentData,
  validateTeacherData,
} = require("../validators/auth.validator");

const prisma = new PrismaClient();

class AuthService {
  async registerUser(userData) {
    const { role } = userData;
    const normalizedRole = role === "TEACHER" ? "TEACHER" : "STUDENT";

    // Role-specific validation
    const validation =
      normalizedRole === "STUDENT"
        ? validateStudentData(userData)
        : validateTeacherData(userData);

    if (!validation.isValid) {
      const error = new Error(validation.errors.join(" "));
      error.status = 400;
      throw error;
    }

    // Check for duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingEmail) {
      const error = new Error("A user with this email already exists.");
      error.status = 409;
      throw error;
    }

    // Check for duplicate rollNo (students only)
    if (normalizedRole === "STUDENT" && userData.rollNo) {
      const existingRollNo = await prisma.user.findUnique({
        where: { rollNo: userData.rollNo },
      });
      if (existingRollNo) {
        const error = new Error("A student with this Roll No already exists.");
        error.status = 409;
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Build the data object based on role
    const createData = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash,
      role: normalizedRole,
    };

    if (normalizedRole === "STUDENT") {
      createData.rollNo = userData.rollNo.trim();
      createData.branchName = userData.branchName;
      createData.guardianEmail =
        userData.guardianEmail?.trim().toLowerCase() || null;
      createData.guardianPhone = userData.guardianPhone?.trim() || null;
    } else {
      createData.department = userData.department.trim();
    }

    const user = await prisma.user.create({ data: createData });

    return { message: "User registered successfully", userId: user.id };
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.status = 400;
      throw error;
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    };
  }

  async bulkRegisterUser(csvDataList) {
    if (!Array.isArray(csvDataList)) {
      const error = new Error("Invalid request payload. Expected an array.");
      error.status = 400;
      throw error;
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const [index, row] of csvDataList.entries()) {
      try {
        const normalizedRole = row.role === "TEACHER" ? "TEACHER" : "STUDENT";

        if (!row.name || !row.email || !row.password) {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing name, email, or password.`);
          continue;
        }

        // Check if user already exists by email
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email.trim().toLowerCase() },
        });
        if (existingUser) {
          skippedCount++;
          continue;
        }

        // Check rollNo uniqueness for students
        if (normalizedRole === "STUDENT" && row.rollNo) {
          const existingRollNo = await prisma.user.findUnique({
            where: { rollNo: row.rollNo.trim() },
          });
          if (existingRollNo) {
            skippedCount++;
            errors.push(`Row ${index + 1}: Duplicate Roll No '${row.rollNo}'.`);
            continue;
          }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(row.password, salt);

        const createData = {
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          passwordHash,
          role: normalizedRole,
        };

        if (normalizedRole === "STUDENT") {
          createData.rollNo = row.rollNo?.trim() || null;
          createData.branchName = row.branchName || null;
          createData.guardianEmail =
            row.guardianEmail?.trim().toLowerCase() || null;
          createData.guardianPhone = row.guardianPhone?.trim() || null;
        } else {
          createData.department = row.department?.trim() || null;
        }

        await prisma.user.create({ data: createData });
        createdCount++;
      } catch (err) {
        skippedCount++;
        errors.push(`Row ${index + 1}: Error - ${err.message}`);
      }
    }

    return {
      message: "Bulk registration finished.",
      createdCount,
      skippedCount,
      errors,
    };
  }
}

module.exports = new AuthService();
