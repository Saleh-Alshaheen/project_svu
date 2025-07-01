// Middlewares/transform_middleware.js

/**
 * @desc    A middleware to ensure specified fields in the request body are arrays.
 * If a field is a single string, it converts it into an array with that string.
 * @param   {...string} fields - The names of the fields to transform.
 */
exports.arrayify =
  (...fields) =>
  (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        if (req.body[field] && !Array.isArray(req.body[field])) {
          // If the field exists and is not an array, convert it to an array
          req.body[field] = [req.body[field]];
        }
      });
    }
    next();
  };
