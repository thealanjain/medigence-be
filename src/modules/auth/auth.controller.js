const authService = require('./auth.service');
const { successResponse, createdResponse, errorResponse } = require('../../utils/response');

const signup = async (req, res, next) => {
  try {
    const { user, token } = await authService.signup(req.body);
    return createdResponse(res, { user, token }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    return successResponse(res, { user, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    return successResponse(res, { user }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
