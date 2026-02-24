const VALID_BRANCHES = ["CSE", "CSE-AI", "ECE", "MECH", "SM"];

/**
 * Validates student registration data.
 * @param {Object} data - The student registration payload.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateStudentData(data) {
  const errors = [];
  const {
    rollNo,
    name,
    email,
    password,
    branchName,
    guardianEmail,
    guardianPhone,
  } = data;

  if (!rollNo || !rollNo.trim())
    errors.push("Roll No is required for students.");
  if (!name || !name.trim()) errors.push("Name is required.");
  if (!email || !email.trim()) errors.push("Email is required.");
  if (!password || password.length < 6)
    errors.push("Password must be at least 6 characters.");

  if (!branchName || !VALID_BRANCHES.includes(branchName)) {
    errors.push(`Branch name must be one of: ${VALID_BRANCHES.join(", ")}.`);
  }

  if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
    errors.push("Guardian email format is invalid.");
  }

  if (guardianPhone && !/^\d{10}$/.test(guardianPhone)) {
    errors.push("Guardian phone must be a 10-digit number.");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates teacher registration data.
 * @param {Object} data - The teacher registration payload.
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateTeacherData(data) {
  const errors = [];
  const { name, email, password, department } = data;

  if (!name || !name.trim()) errors.push("Name is required.");
  if (!email || !email.trim()) errors.push("Email is required.");
  if (!password || password.length < 6)
    errors.push("Password must be at least 6 characters.");
  if (!department || !department.trim())
    errors.push("Department is required for teachers.");

  return { isValid: errors.length === 0, errors };
}

module.exports = { validateStudentData, validateTeacherData, VALID_BRANCHES };
