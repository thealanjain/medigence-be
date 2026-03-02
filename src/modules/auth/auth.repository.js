const { query } = require('../../database/db');

const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await query('SELECT id, email, role, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createUser = async ({ email, passwordHash, role }) => {
  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
    [email, passwordHash, role]
  );
  return result.rows[0];
};

module.exports = { findUserByEmail, findUserById, createUser };
