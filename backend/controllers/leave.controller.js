const leaveService = require("../services/leave.service");

exports.requestLeaveForSession = async (req, res, next) => {
  try {
    const result = await leaveService.requestLeaveForSession(
      req.user.id,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.requestLeaveForFutureDate = async (req, res, next) => {
  try {
    const result = await leaveService.requestLeaveForFutureDate(
      req.user.id,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getStudentLeaveRequests = async (req, res, next) => {
  try {
    const result = await leaveService.getStudentLeaveRequests(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getTeacherPendingRequests = async (req, res, next) => {
  try {
    const result = await leaveService.getTeacherPendingRequests(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSessionLeaveRequests = async (req, res, next) => {
  try {
    const result = await leaveService.getSessionLeaveRequests(
      req.params.sessionId,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.reviewLeaveRequest = async (req, res, next) => {
  try {
    const result = await leaveService.reviewLeaveRequest(
      parseInt(req.params.requestId),
      req.user.id,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.cancelLeaveRequest = async (req, res, next) => {
  try {
    const result = await leaveService.cancelLeaveRequest(
      parseInt(req.params.requestId),
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
