const attendanceService = require("../services/attendance.service");

exports.markAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.markAttendance(
      req.user.id,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.distance !== undefined) {
      return res.status(error.status).json({
        error: "Location validation failed",
        message: error.message,
        distance: error.distance,
      });
    }
    next(error);
  }
};

exports.getAttendanceHistory = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceHistory(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
