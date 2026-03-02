const { errorResponse } = require('../utils/response');

/**
 * Zod validation middleware factory
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return errorResponse(res, 'Validation failed', 422, errors);
    }

    req[source] = result.data;
    next();
  };
};

module.exports = validate;
