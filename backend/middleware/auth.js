const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Payload contains { id, role }
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

const isTeacher = (req, res, next) => {
  if (req.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access Denied. Teachers only." });
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access Denied. Students only." });
  }
  next();
};

module.exports = { verifyToken, isTeacher, isStudent };
