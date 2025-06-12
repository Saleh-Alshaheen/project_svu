const { check } = require("express-validator");
// Our standard middleware for handling validation results.
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const userModel = require("../../models/user_model");

// Validation rules for the signup endpoint.
exports.signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name is required.")
    .isLength({ min: 3 })
    .withMessage("Name is too short, must be at least 3 characters."),

  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    // Custom validator to check if the email is already in use.
    .custom((val) =>
      userModel.findOne({ email: val }).then((user) => {
        if (user) {
          // Reject the promise if the user exists, signaling a validation error.
          return Promise.reject(new Error("E-mail already in use."));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long.")
    // Custom validator to ensure password confirmation matches.
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password confirmation does not match password.");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required."),
  // The middleware that runs after the validation checks.
  validatorMiddleware,
];

// Validation rules for the login endpoint.
exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),

  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  validatorMiddleware,
];

// NEW: Validation rules for the forgot password endpoint.
exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  validatorMiddleware,
];

// NEW: Validation rules for the verify reset code endpoint.
exports.verifyResetCodeValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage("Reset code is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("Reset code must be 6 digits long."),
  validatorMiddleware,
];

// NEW: Validation rules for the reset password endpoint.
exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  validatorMiddleware,
];
