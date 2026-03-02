const { query } = require('../../database/db');

const getAllDoctors = async () => {
  const result = await query(
    `SELECT d.id, d.name, d.specialization, u.id as user_id, d.bio, d.available_slots, d.created_at, u.email
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     ORDER BY d.name ASC`
  );
  return result.rows;
};

const getDoctorById = async (id) => {
  const result = await query(
    `SELECT d.id, d.name, d.specialization, d.bio, d.available_slots, d.created_at,
            u.email, u.id as user_id
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getDoctorByUserId = async (userId) => {
  const result = await query(
    `SELECT d.id, d.name, d.specialization, d.bio, d.available_slots, d.created_at, d.user_id
     FROM doctors d
     WHERE d.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

module.exports = { getAllDoctors, getDoctorById, getDoctorByUserId };
