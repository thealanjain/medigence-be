const { query, getClient } = require('../../database/db');

// ─── DRAFTS ──────────────────────────────────────────────────────────────────

const upsertDraft = async (patientId, stepNumber, draftJson) => {
  const result = await query(
    `INSERT INTO onboarding_drafts (patient_id, step_number, draft_json)
     VALUES ($1, $2, $3)
     ON CONFLICT (patient_id, step_number)
     DO UPDATE SET draft_json = $3, updated_at = NOW()
     RETURNING *`,
    [patientId, stepNumber, draftJson]
  );
  return result.rows[0];
};

const getDraftsByPatient = async (patientId) => {
  const result = await query(
    `SELECT step_number, draft_json, updated_at
     FROM onboarding_drafts
     WHERE patient_id = $1
     ORDER BY step_number ASC`,
    [patientId]
  );
  return result.rows;
};

const getDraftByStep = async (patientId, stepNumber) => {
  const result = await query(
    `SELECT * FROM onboarding_drafts
     WHERE patient_id = $1 AND step_number = $2`,
    [patientId, stepNumber]
  );
  return result.rows[0] || null;
};

// ─── STEP CHECKS ─────────────────────────────────────────────────────────────

const getPatientProfile = async (userId) => {
  const result = await query(
    'SELECT * FROM patient_profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const getMedicalInfo = async (userId) => {
  const result = await query(
    'SELECT * FROM medical_information WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const getInsuranceInfo = async (userId) => {
  const result = await query(
    'SELECT * FROM insurance_information WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

// ─── STEP 1: PERSONAL INFO ───────────────────────────────────────────────────

const upsertPatientProfile = async (userId, data) => {
  const { full_name, age, gender, phone, address, city, country } = data;
  const result = await query(
    `INSERT INTO patient_profiles (user_id, full_name, age, gender, phone, address, city, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id)
     DO UPDATE SET
       full_name = $2, age = $3, gender = $4, phone = $5,
       address = $6, city = $7, country = $8, updated_at = NOW()
     RETURNING *`,
    [userId, full_name, age, gender || null, phone, address || null, city || null, country]
  );
  return result.rows[0];
};

// ─── STEP 2: MEDICAL INFO ────────────────────────────────────────────────────

const upsertMedicalInfo = async (userId, data) => {
  const {
    blood_type, allergies, chronic_conditions,
    current_medications, emergency_contact, emergency_phone, additional_notes
  } = data;
  const result = await query(
    `INSERT INTO medical_information
       (user_id, blood_type, allergies, chronic_conditions, current_medications, emergency_contact, emergency_phone, additional_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id)
     DO UPDATE SET
       blood_type = $2, allergies = $3, chronic_conditions = $4,
       current_medications = $5, emergency_contact = $6, emergency_phone = $7,
       additional_notes = $8, updated_at = NOW()
     RETURNING *`,
    [
      userId,
      blood_type || null,
      allergies || [],
      chronic_conditions || [],
      current_medications || null,
      emergency_contact || null,
      emergency_phone || null,
      additional_notes || null,
    ]
  );
  return result.rows[0];
};

// ─── STEP 3: INSURANCE INFO ──────────────────────────────────────────────────

const upsertInsuranceInfo = async (userId, data) => {
  const {
    preferred_doctor_id, preferred_time_slot, referral_source,
    insurance_provider, policy_number
  } = data;
  const result = await query(
    `INSERT INTO insurance_information
       (user_id, preferred_doctor_id, preferred_time_slot, referral_source, insurance_provider, policy_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id)
     DO UPDATE SET
       preferred_doctor_id = $2, preferred_time_slot = $3, referral_source = $4,
       insurance_provider = $5, policy_number = $6, updated_at = NOW()
     RETURNING *`,
    [
      userId,
      preferred_doctor_id,
      preferred_time_slot || null,
      referral_source || null,
      insurance_provider || null,
      policy_number || null,
    ]
  );
  return result.rows[0];
};

// ─── SUBMIT: ASSIGN DOCTOR & CREATE CHAT ─────────────────────────────────────

const assignDoctorToPatient = async (patientId, doctorId) => {
  // doctorId here is the doctors.id, we need doctors.user_id for chat
  const result = await query(
    `INSERT INTO patient_doctor_assignments (patient_id, doctor_id)
     VALUES ($1, $2)
     ON CONFLICT (patient_id) DO UPDATE SET doctor_id = $2, assigned_at = NOW()
     RETURNING *`,
    [patientId, doctorId]
  );
  return result.rows[0];
};

const createChat = async (patientId, doctorUserId) => {
  const result = await query(
    `INSERT INTO chats (patient_id, doctor_id)
     VALUES ($1, $2)
     ON CONFLICT (patient_id, doctor_id) DO UPDATE SET patient_id = $1
     RETURNING *`,
    [patientId, doctorUserId]
  );
  return result.rows[0];
};

const getDoctorUserIdById = async (doctorId) => {
  const result = await query(
    'SELECT user_id FROM doctors WHERE id = $1',
    [doctorId]
  );
  return result.rows[0]?.user_id || null;
};

module.exports = {
  upsertDraft,
  getDraftsByPatient,
  getDraftByStep,
  getPatientProfile,
  getMedicalInfo,
  getInsuranceInfo,
  upsertPatientProfile,
  upsertMedicalInfo,
  upsertInsuranceInfo,
  assignDoctorToPatient,
  createChat,
  getDoctorUserIdById,
};
