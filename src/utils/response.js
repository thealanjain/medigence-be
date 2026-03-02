/**
 * Standard API response helpers
 */

const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
    data: {},
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const createdResponse = (res, data = {}, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

module.exports = { successResponse, errorResponse, createdResponse };
