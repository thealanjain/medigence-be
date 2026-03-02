const onboardingService = require('./onboarding.service');
const { successResponse, createdResponse } = require('../../utils/response');

const saveStep1 = async (req, res, next) => {
  try {
    const result = await onboardingService.saveStep1(req.user.userId, req.body);
    return successResponse(res, { profile: result }, 'Step 1 saved successfully');
  } catch (error) {
    next(error);
  }
};

const saveStep2 = async (req, res, next) => {
  try {
    const result = await onboardingService.saveStep2(req.user.userId, req.body);
    return successResponse(res, { medical: result }, 'Step 2 saved successfully');
  } catch (error) {
    next(error);
  }
};

const saveStep3 = async (req, res, next) => {
  try {
    const result = await onboardingService.saveStep3(req.user.userId, req.body);
    return successResponse(res, { insurance: result }, 'Step 3 saved successfully');
  } catch (error) {
    next(error);
  }
};

const getDraft = async (req, res, next) => {
  try {
    const draft = await onboardingService.getDraft(req.user.userId);
    return successResponse(res, draft, 'Draft fetched successfully');
  } catch (error) {
    next(error);
  }
};

const submitOnboarding = async (req, res, next) => {
  try {
    const result = await onboardingService.submitOnboarding(req.user.userId);
    return createdResponse(res, result, 'Onboarding completed! Doctor assigned and chat created.');
  } catch (error) {
    next(error);
  }
};

module.exports = { saveStep1, saveStep2, saveStep3, getDraft, submitOnboarding };
