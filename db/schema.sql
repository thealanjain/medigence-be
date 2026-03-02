-- ============================================================
-- Medigence - Patient Onboarding & Doctor Chat System
-- Full database schema with seed data
-- Run: psql $DATABASE_URL < db/schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP existing tables (clean slate)
-- ============================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS onboarding_drafts CASCADE;
DROP TABLE IF EXISTS patient_doctor_assignments CASCADE;
DROP TABLE IF EXISTS insurance_information CASCADE;
DROP TABLE IF EXISTS medical_information CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- ENUM types
-- ============================================================
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS blood_type_enum CASCADE;

CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR');

CREATE TYPE blood_type_enum AS ENUM (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'PATIENT',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- Table: doctors
-- ============================================================
CREATE TABLE doctors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  specialization   VARCHAR(255) NOT NULL,
  bio              TEXT,
  available_slots  TEXT[] DEFAULT ARRAY['Morning', 'Afternoon', 'Evening'],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);

-- ============================================================
-- Table: patient_profiles (Onboarding Step 1)
-- ============================================================
CREATE TABLE patient_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name    VARCHAR(255) NOT NULL,
  age          INTEGER NOT NULL CHECK (age >= 18),
  gender       VARCHAR(50),
  phone        VARCHAR(30) NOT NULL,
  address      TEXT,
  city         VARCHAR(100),
  country      VARCHAR(100) DEFAULT 'India',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_profiles_user_id ON patient_profiles(user_id);

-- ============================================================
-- Table: medical_information (Onboarding Step 2)
-- ============================================================
CREATE TABLE medical_information (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  blood_type          blood_type_enum,
  allergies           TEXT[] DEFAULT '{}',
  chronic_conditions  TEXT[] DEFAULT '{}',
  current_medications TEXT,
  emergency_contact   VARCHAR(255),
  emergency_phone     VARCHAR(30),
  additional_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_info_user_id ON medical_information(user_id);

-- ============================================================
-- Table: insurance_information (Onboarding Step 3)
-- ============================================================
CREATE TABLE insurance_information (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  preferred_time_slot VARCHAR(100),
  referral_source     VARCHAR(255),
  insurance_provider  VARCHAR(255),
  policy_number       VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_info_user_id ON insurance_information(user_id);

-- ============================================================
-- Table: onboarding_drafts
-- ============================================================
CREATE TABLE onboarding_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 4),
  draft_json   JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, step_number)
);

CREATE INDEX idx_onboarding_drafts_patient ON onboarding_drafts(patient_id);

-- ============================================================
-- Table: patient_doctor_assignments
-- ============================================================
CREATE TABLE patient_doctor_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_patient ON patient_doctor_assignments(patient_id);
CREATE INDEX idx_assignments_doctor  ON patient_doctor_assignments(doctor_id);

-- ============================================================
-- Table: chats
-- ============================================================
CREATE TABLE chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

CREATE INDEX idx_chats_patient ON chats(patient_id);
CREATE INDEX idx_chats_doctor  ON chats(doctor_id);

-- ============================================================
-- Table: messages
-- ============================================================
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id      UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id   ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created   ON messages(created_at);

-- ============================================================
-- Function: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_patient_profiles_updated_at
  BEFORE UPDATE ON patient_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_medical_information_updated_at
  BEFORE UPDATE ON medical_information
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_insurance_information_updated_at
  BEFORE UPDATE ON insurance_information
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_onboarding_drafts_updated_at
  BEFORE UPDATE ON onboarding_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done
