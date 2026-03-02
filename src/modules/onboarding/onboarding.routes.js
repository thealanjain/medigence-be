const express = require('express');
const router = express.Router();
const onboardingController = require('./onboarding.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const validate = require('../../middleware/validate');
const { step1Schema, step2Schema, step3Schema } = require('./onboarding.schema');

// All onboarding routes require PATIENT role
router.use(authMiddleware);
router.use(roleMiddleware('PATIENT'));

// POST /onboarding/step-1
router.post('/step-1', validate(step1Schema), onboardingController.saveStep1);

// POST /onboarding/step-2
router.post('/step-2', validate(step2Schema), onboardingController.saveStep2);

// POST /onboarding/step-3
router.post('/step-3', validate(step3Schema), onboardingController.saveStep3);

// GET /onboarding/draft
router.get('/draft', onboardingController.getDraft);

// POST /onboarding/submit
router.post('/submit', onboardingController.submitOnboarding);

module.exports = router;
