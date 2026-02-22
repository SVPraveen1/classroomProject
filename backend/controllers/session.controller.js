const sessionService = require("../services/session.service");

exports.startSession = async (req, res, next) => {
  try {
    const result = await sessionService.startSession(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.endSession = async (req, res, next) => {
  try {
    const result = await sessionService.endSession(
      req.user.id,
      req.body.sessionId,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getActiveSession = async (req, res, next) => {
  try {
    const result = await sessionService.getActiveSession(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSessionAttendees = async (req, res, next) => {
  try {
    const result = await sessionService.getSessionAttendees(
      req.params.sessionId,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSessionHistory = async (req, res, next) => {
  try {
    const result = await sessionService.getSessionHistory(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.overrideAttendance = async (req, res, next) => {
  try {
    const result = await sessionService.overrideAttendance(
      req.user.id,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
