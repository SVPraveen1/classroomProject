const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

class AuthService {
  async registerUser(userData) {
    const { name, email, password, role } = userData;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error("User already exists");
      error.status = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "STUDENT",
      },
    });

    return { message: "User registered successfully", userId: user.id };
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({ where: { email } });
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

    // Process sequentially to easily handle bcrypt async and avoid overloading connection pools
    for (const [index, row] of csvDataList.entries()) {
      try {
        const { name, email, password, role } = row;

        if (!name || !email || !password) {
          skippedCount++;
          errors.push(`Row ${index + 1}: Missing name, email, or password.`);
          continue;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          skippedCount++;
          continue;
        }

        // Hash and insert
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: role === "TEACHER" ? "TEACHER" : "STUDENT",
          },
        });

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
