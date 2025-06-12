const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const UserModel = require("../../models/user_model");

// Validation rules for creating a new user.
exports.createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("User name is required.")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters."),

  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .custom((val) =>
      UserModel.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in use."));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long.")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password confirmation does not match password.");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required."),

  check("phone")
    .optional()
    .isMobilePhone("ar-SY")
    .withMessage("Invalid phone number. Please enter a Syrian mobile number."),

  check("profileImage").optional(),
  check("role").optional(),
  validatorMiddleware,
];

// Validation rules for checking a user ID.
exports.getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format."),
  validatorMiddleware,
];

// Validation rules for updating a user's data.
exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format."),
  body("name").optional(),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address.")
    .custom((val, { req }) =>
      UserModel.findOne({ email: val }).then((user) => {
        if (user && user._id.toString() !== req.params.id) {
          return Promise.reject(new Error("E-mail already in use."));
        }
      })
    ),
  check("phone")
    .optional()
    .isMobilePhone("ar-SY")
    .withMessage("Invalid phone number. Please enter a Syrian mobile number."),
  check("profileImage").optional(),
  check("role").optional(),
  validatorMiddleware,
];

// Validation rules for an admin changing a user's password.
exports.changeUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required.")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Password confirmation does not match.");
      }
      return true;
    }),
  validatorMiddleware,
];

// Validation rules for deleting a user.
exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid User ID format."),
  validatorMiddleware,
];

// Validation rules for a logged-in user updating their own data.
exports.updateLoggedUserValidator = [
  body("name").optional(),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address.")
    .custom((val, { req }) =>
      UserModel.findOne({ email: val }).then((user) => {
        if (user && user._id.toString() !== req.user._id.toString()) {
          return Promise.reject(new Error("E-mail already in use."));
        }
      })
    ),
  check("phone")
    .optional()
    .isMobilePhone("ar-SY")
    .withMessage("Invalid phone number. Please enter a Syrian mobile number."),
  validatorMiddleware,
];

// NEW: Validation rules for a logged-in user changing their own password.
exports.updateLoggedUserPasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("You must enter your current password.")
    .custom(async (val, { req }) => {
      // 1) Verify current password is correct
      const user = await UserModel.findById(req.user._id);
      const isCorrectPassword = await bcrypt.compare(val, user.password);
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password.");
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("You must enter a new password.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("You must enter the password confirmation.")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Password confirmation does not match.");
      }
      return true;
    }),
  validatorMiddleware,
];
