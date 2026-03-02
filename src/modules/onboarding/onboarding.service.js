const onboardingRepo = require('./onboarding.repository');
const doctorsRepo = require('../doctors/doctors.repository');

// ─── DRAFT HELPERS ────────────────────────────────────────────────────────────

const saveDraft = async (patientId, stepNumber, data) => {
  return await onboardingRepo.upsertDraft(patientId, stepNumber, JSON.stringify(data));
};

const getDraft = async (patientId) => {
  const drafts = await onboardingRepo.getDraftsByPatient(patientId);

  // Also check which steps are already persisted
  const [profile, medical, insurance] = await Promise.all([
    onboardingRepo.getPatientProfile(patientId),
    onboardingRepo.getMedicalInfo(patientId),
    onboardingRepo.getInsuranceInfo(patientId),
  ]);

  const completedSteps = [];
  if (profile) completedSteps.push(1);
  if (medical) completedSteps.push(2);
  if (insurance) completedSteps.push(3);

  // Suggest next step
  const nextStep = completedSteps.length < 3 ? (completedSteps.length + 1) : null;

  return {
    drafts,
    completed_steps: completedSteps,
    next_step: nextStep,
    is_complete: completedSteps.length === 3,
  };
};

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

const saveStep1 = async (patientId, data) => {
  // Persist to actual table AND save draft for resumability
  const profile = await onboardingRepo.upsertPatientProfile(patientId, data);
  await saveDraft(patientId, 1, data);
  return profile;
};

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

const saveStep2 = async (patientId, data) => {
  // Step 1 must be completed first
  const profile = await onboardingRepo.getPatientProfile(patientId);
  if (!profile) {
    const error = new Error('Please complete Step 1 (Personal Information) first');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  const medicalInfo = await onboardingRepo.upsertMedicalInfo(patientId, data);
  await saveDraft(patientId, 2, data);
  return medicalInfo;
};

// ─── STEP 3 ───────────────────────────────────────────────────────────────────

const saveStep3 = async (patientId, data) => {
  // Steps 1 & 2 must be completed first
  const [profile, medical] = await Promise.all([
    onboardingRepo.getPatientProfile(patientId),
    onboardingRepo.getMedicalInfo(patientId),
  ]);

  if (!profile) {
    const error = new Error('Please complete Step 1 (Personal Information) first');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }
  if (!medical) {
    const error = new Error('Please complete Step 2 (Medical Information) first');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  // Validate preferred doctor exists
  const doctor = await doctorsRepo.getDoctorById(data.preferred_doctor_id);
  if (!doctor) {
    const error = new Error('Selected doctor does not exist');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const insuranceInfo = await onboardingRepo.upsertInsuranceInfo(patientId, data);
  await saveDraft(patientId, 3, data);
  return insuranceInfo;
};

// ─── FINAL SUBMIT ─────────────────────────────────────────────────────────────

const submitOnboarding = async (patientId) => {
  // Verify all 3 steps are complete
  const [profile, medical, insurance] = await Promise.all([
    onboardingRepo.getPatientProfile(patientId),
    onboardingRepo.getMedicalInfo(patientId),
    onboardingRepo.getInsuranceInfo(patientId),
  ]);

  const missing = [];
  if (!profile) missing.push('Step 1: Personal Information');
  if (!medical) missing.push('Step 2: Medical Information');
  if (!insurance) missing.push('Step 3: Insurance Information');

  if (missing.length > 0) {
    const error = new Error(`Onboarding incomplete. Missing: ${missing.join(', ')}`);
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  // Get the preferred doctor
  const preferredDoctorId = insurance.preferred_doctor_id;
  if (!preferredDoctorId) {
    const error = new Error('No preferred doctor selected in Step 3');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  // Get doctor's user_id for chat
  const doctorUserId = await onboardingRepo.getDoctorUserIdById(preferredDoctorId);
  if (!doctorUserId) {
    const error = new Error('Selected doctor account not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // Assign patient to doctor
  const assignment = await onboardingRepo.assignDoctorToPatient(patientId, preferredDoctorId);

  // Create chat room between patient and doctor
  const chat = await onboardingRepo.createChat(patientId, doctorUserId);

  return {
    assignment,
    chat,
    summary: {
      profile,
      medical,
      insurance,
    },
  };
};

module.exports = { saveDraft, getDraft, saveStep1, saveStep2, saveStep3, submitOnboarding };
