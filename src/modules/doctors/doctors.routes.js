const express = require('express');
const router = express.Router();
const doctorsController = require('./doctors.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// GET /doctors - public for onboarding dropdown
router.get('/', authMiddleware, doctorsController.getAllDoctors);

// GET /doctors/:id
router.get('/:id', authMiddleware, doctorsController.getDoctorById);

module.exports = router;
