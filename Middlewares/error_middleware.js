// Import the refactored custom error class.
const ApiError = require("../utils/API_Errors");

/**
 * Creates a structured ApiError for Mongoose's CastError (e.g., invalid ID format).
 * @param {Error} err The CastError object.
 * @returns {ApiError} A new ApiError instance with a 400 Bad Request status.
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ApiError(message, 400);
};

/**
 * Creates a structured ApiError for Mongoose's duplicate field error (code 11000).
 * @param {Error} err The duplicate field error object.
 * @returns {ApiError} A new ApiError instance with a 400 Bad Request status.
 */
const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicate value from the error message.
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new ApiError(message, 400);
};

/**
 * Creates a structured ApiError for an invalid JWT signature.
 * @returns {ApiError} A new ApiError instance with a 401 Unauthorized status.
 */
const handleJwtInvalidSignature = () =>
  new ApiError("Invalid token, please login again.", 401);

/**
 * Creates a structured ApiError for an expired JWT.
 * @returns {ApiError} A new ApiError instance with a 401 Unauthorized status.
 */
const handleJwtExpired = () =>
  new ApiError("Expired token, please login again.", 401);

/**
 * Sends a detailed error response during development.
 * @param {Error} err - The error object.
 * @param {import('express').Response} res - The Express response object.
 */
const sendErrorDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

/**
 * Sends a generic or operational error response in production.
 * @param {ApiError | Error} err - The error object.
 * @param {import('express').Response} res - The Express response object.
 */
const sendErrorProd = (err, res) => {
  // A) Operational, trusted error: send message to client.
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details.
  // 1) Log error for developers.
  console.error("ERROR 💥", err);
  // 2) Send generic message to client.
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

/**
 * Global error handling middleware for Express.
 */
const globalErrorHandler = (err, req, res, next) => {
  // Set default status code and status for errors that don't have them.
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // Create a hard copy of the error object.
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      errmsg: err.errmsg,
    };

    // Convert known technical errors into operational ApiError instances.
    if (error.name === "JsonWebTokenError") error = handleJwtInvalidSignature();
    if (error.name === "TokenExpiredError") error = handleJwtExpired();
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
