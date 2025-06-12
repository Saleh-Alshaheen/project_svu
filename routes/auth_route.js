const express = require("express");

// Import the validation rule chains, including the new ones.
const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/auth_validator");

// Import the controller functions that contain the business logic.
const {
  signup,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/auth_control");

// Create a new router object.
const router = express.Router();

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", signupValidator, signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Log in an existing user
 * @access  Public
 */
router.post("/login", loginValidator, login);

/**
 * @route   POST /api/v1/auth/forgotPassword
 * @desc    Initiate the password reset process
 * @access  Public
 */
router.post("/forgotPassword", forgotPasswordValidator, forgotPassword);

/**
 * @route   POST /api/v1/auth/verifyResetCode
 * @desc    Verify the password reset code
 * @access  Public
 */
router.post("/verifyResetCode", verifyResetCodeValidator, verifyResetCode);

/**
 * @route   PUT /api/v1/auth/resetPassword
 * @desc    Reset the user's password
 * @access  Public
 */
router.put("/resetPassword", resetPasswordValidator, resetPassword);

// Export the router to be mounted in the main application.
module.exports = router;
