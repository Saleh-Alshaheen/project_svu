// Import the validationResult function from express-validator.
const { validationResult } = require("express-validator");

/**
 * @description Express middleware that checks for validation errors collected by express-validator.
 * If errors are found, it terminates the request-response cycle and sends a 400 response.
 * If the request is valid, it passes control to the next middleware.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const validatorMiddleware = (req, res, next) => {
  // 1) Get the validation results from the request object.
  const errors = validationResult(req);

  // 2) Check if there are any validation errors.
  if (!errors.isEmpty()) {
    // 3) If errors exist, send a 400 Bad Request response with the array of errors.
    return res.status(400).json({ errors: errors.array() });
  }

  // 4) If no errors, pass control to the next middleware in the stack (e.g., the controller).
  next();
};

module.exports = validatorMiddleware;
