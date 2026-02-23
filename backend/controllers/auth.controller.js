const authService = require("../services/auth.service");

exports.register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.bulkRegister = async (req, res, next) => {
  try {
    const result = await authService.bulkRegisterUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
