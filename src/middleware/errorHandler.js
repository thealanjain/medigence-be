/**
 * Centralized error handling middleware
 * Must be registered LAST in Express middleware chain
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      data: {},
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
      data: {},
    });
  }

  // Postgres check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Data violates a database constraint',
      data: {},
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    data: {},
  });
};

module.exports = errorHandler;
