const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');
const { signupSchema, loginSchema } = require('./auth.schema');

// POST /auth/signup
router.post('/signup', validate(signupSchema), authController.signup);

// POST /auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /auth/me
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
