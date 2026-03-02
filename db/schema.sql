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
  step_number  INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 3),
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

-- ============================================================
-- SEED DATA
-- Passwords: Doctor@123 (doctors), Patient@123 (patient)
-- All hashed with bcrypt rounds=10
-- ============================================================

-- Seed: Doctor users
INSERT INTO users (id, email, password_hash, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'dr.sharma@medigence.com',  '$2b$10$fzyHrrFGiodRJsbhdDC6WujFcxv7vEhLOJz/iKq7nl2zNrkIa6UCy', 'DOCTOR'),
  ('a1000000-0000-0000-0000-000000000002', 'dr.patel@medigence.com',   '$2b$10$GZz/k8p7nAdSk7VquGYpmuX9C6gIeqMTWu1szIL7/9CVdvvQAW4fK', 'DOCTOR'),
  ('a1000000-0000-0000-0000-000000000003', 'dr.kapoor@medigence.com',  '$2b$10$dQaxpFqjVUmRQBYifYswquIHERTGKc/xynYJUIuZAptudBe3f826W',  'DOCTOR');

-- Seed: Patient user
INSERT INTO users (id, email, password_hash, role) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'patient.demo@medigence.com', '$2b$10$g2R7xBidtQm/.HR9f/5K1.bcX2a9oA0eO7E0faUs0Y6aMoLUlxlCu', 'PATIENT');

-- Seed: Doctor profiles
INSERT INTO doctors (id, user_id, name, specialization, bio) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Arjun Sharma',  'Cardiologist',        'Specialist in cardiovascular diseases with 15+ years experience.'),
  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Dr. Priya Patel',   'General Physician',   'Experienced in preventive care and chronic disease management.'),
  ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Dr. Rahul Kapoor',  'Orthopedic Surgeon',  'Expert in bone and joint surgeries, sports medicine.');

-- Seed: Patient profile (Step 1)
INSERT INTO patient_profiles (user_id, full_name, age, gender, phone, address, city, country) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'Demo Patient', 28, 'Male', '+91-9876543210', '123 Main Street', 'Mumbai', 'India');

-- Seed: Medical information (Step 2)
INSERT INTO medical_information (user_id, blood_type, allergies, chronic_conditions, current_medications) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'O+', ARRAY['Penicillin'], ARRAY['Hypertension'], 'Amlodipine 5mg');

-- Seed: Insurance information (Step 3) - preferred Dr. Sharma
INSERT INTO insurance_information (user_id, preferred_doctor_id, preferred_time_slot, referral_source, insurance_provider) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001', 'Morning', 'Online Search', 'Star Health Insurance');

-- Seed: Patient-doctor assignment
INSERT INTO patient_doctor_assignments (patient_id, doctor_id) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001');

-- Seed: Chat record
INSERT INTO chats (id, patient_id, doctor_id) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001');

-- Seed: Sample messages
INSERT INTO messages (chat_id, sender_id, message_text, is_read) VALUES
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Welcome! I am Dr. Arjun Sharma. How can I help you today?', TRUE),
  ('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Hello Doctor, I have been experiencing some chest pain recently.', TRUE),
  ('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'I understand. Can you describe the pain - is it sharp or dull, and when does it occur?', FALSE);

-- Done
