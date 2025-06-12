/**
 * @class ApiError
 * @extends Error
 * @description A custom error class for handling API-specific errors with status codes.
 * This allows for creating predictable, operational errors that can be handled globally.
 */
class ApiError extends Error {
  /**
   * @param {string} message The error message.
   * @param {number} statusCode The HTTP status code for the error.
   */
  constructor(message, statusCode) {
    // Call the parent constructor (Error) with the message.
    super(message);

    // The HTTP status code (e.g., 404, 500).
    this.statusCode = statusCode;

    // A simple status text ('fail' for 4xx client errors, 'error' for 5xx server errors).
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // A flag to distinguish operational errors (expected, like invalid input)
    // from programming errors (bugs). This is used by the global error handler.
    this.isOperational = true;
  }
}

module.exports = ApiError;
