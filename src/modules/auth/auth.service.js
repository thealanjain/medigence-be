const bcrypt = require('bcrypt');
const authRepository = require('./auth.repository');
const { generateToken } = require('../../utils/jwt');

const SALT_ROUNDS = 10;

const signup = async ({ email, password, role }) => {
  // Check if email already exists
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    error.isOperational = true;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await authRepository.createUser({ email, passwordHash, role });

  // Generate JWT
  const token = generateToken({ userId: user.id, role: user.role });

  return { user, token };
};

const login = async ({ email, password }) => {
  // Find user
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  // Generate JWT
  const token = generateToken({ userId: user.id, role: user.role });

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };

  return { user: safeUser, token };
};

const getMe = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return user;
};

module.exports = { signup, login, getMe };
