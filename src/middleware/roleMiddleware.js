const { errorResponse } = require('../utils/response');

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles e.g. 'PATIENT', 'DOCTOR'
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

module.exports = roleMiddleware;
