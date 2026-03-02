const onboardingRepo = require('./onboarding.repository');

// ─── DRAFT HELPERS ────────────────────────────────────────────────────────────

const saveDraft = async (patientId, stepNumber, data) => {
  return await onboardingRepo.upsertDraft(patientId, stepNumber, JSON.stringify(data));
};

const getDraft = async (patientId) => {
  const draftsRaw = await onboardingRepo.getDraftsByPatient(patientId);
  const drafts = draftsRaw.map((d) => ({
    step_number: d.step_number,
    data: d.draft_json,
    updated_at: d.updated_at,
  }));

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

  // Check if step 4 (submission) is recorded as a ghost draft
  const hasFinishedReview = drafts.some((d) => d.step_number === 4);
  if (hasFinishedReview) completedSteps.push(4);

  // Suggest next step
  let nextStep = null;
  if (!profile) nextStep = 1;
  else if (!medical) nextStep = 2;
  else if (!insurance) nextStep = 3;
  else if (!hasFinishedReview) nextStep = 4;

  const isComplete = completedSteps.includes(4);

  return {
    drafts,
    completed_steps: completedSteps,
    next_step: nextStep,
    is_complete: isComplete,
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

  const insuranceInfo = await onboardingRepo.upsertInsuranceInfo(patientId, data);
  await saveDraft(patientId, 3, data);
  return insuranceInfo;
};

// ─── FINAL SUBMIT ─────────────────────────────────────────────────────────────

const submitOnboarding = async (patientId) => {
  // Verify all 3 steps are complete (actual data is in DB)
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

  // Get preferred doctor, prioritize DB record then draft
  let preferredDoctorId = insurance?.preferred_doctor_id;

  if (!preferredDoctorId) {
    const step3Draft = await onboardingRepo.getDraftByStep(patientId, 3);
    if (step3Draft?.draft_json) {
      const data = typeof step3Draft.draft_json === 'string' ? JSON.parse(step3Draft.draft_json) : step3Draft.draft_json;
      preferredDoctorId = data?.preferred_doctor_id;
    }
  }

  let assignment = null;
  let chat = null;

  if (preferredDoctorId) {
    // Get doctor's user_id for chat
    const doctorUserId = await onboardingRepo.getDoctorUserIdById(preferredDoctorId);
    if (doctorUserId) {
      console.log(`[Submit] Found doctor ${preferredDoctorId} (user_id: ${doctorUserId}), creating assignment and chat`);
      // Assign patient to doctor
      assignment = await onboardingRepo.assignDoctorToPatient(patientId, preferredDoctorId);
      // Create chat room
      chat = await onboardingRepo.createChat(patientId, doctorUserId);
    } else {
      console.warn(`[Submit] Doctor record ${preferredDoctorId} has no associated user_id`);
    }
  } else {
    console.warn(`[Submit] No preferred doctor found in insurance record or draft for patient ${patientId}`);
  }

  // Record that onboarding is completed via Step 4 ghost draft
  await saveDraft(patientId, 4, { completed: true, timestamp: new Date().toISOString() });

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
