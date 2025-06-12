const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const CouponModel = require("../../models/coupon_model");

// Validation rules for creating a new coupon.
exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("Coupon name is required.")
    // Sanitization: Convert to uppercase to ensure case-insensitivity.
    .trim()
    .toUpperCase()
    // Custom validator to ensure the sanitized coupon name is unique.
    .custom(async (value) => {
      const coupon = await CouponModel.findOne({ name: value });
      if (coupon) {
        return Promise.reject(
          new Error(
            "This coupon name already exists. Please use a unique name."
          )
        );
      }
      return true;
    }),

  check("expire")
    .notEmpty()
    .withMessage("Coupon expiration date is required.")
    .isISO8601() // Validates that the string is a valid ISO 8601 date format.
    .toDate() // Converts the valid string into a JavaScript Date object.
    .custom((value) => {
      // Custom validation to ensure the date is in the future.
      if (value.getTime() <= Date.now()) {
        throw new Error("Expiration date must be in the future.");
      }
      return true;
    }),

  check("discount")
    .notEmpty()
    .withMessage("Coupon discount value is required.")
    .isNumeric()
    .withMessage("Discount value must be a number.")
    // Ensures the discount is a reasonable percentage.
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("Discount value must be between 0.01 and 100."),
  validatorMiddleware,
];

// Validation rules for updating an existing coupon.
exports.updateCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format."),
  // 'body' is used here to validate fields that are part of the update payload.
  body("name")
    .optional()
    .trim()
    .toUpperCase()
    // Checks for uniqueness but excludes the current document from the search.
    .custom(async (value, { req }) => {
      const coupon = await CouponModel.findOne({
        name: value,
        _id: { $ne: req.params.id },
      });
      if (coupon) {
        return Promise.reject(
          new Error("This coupon name is already used by another coupon.")
        );
      }
      return true;
    }),

  body("expire")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value.getTime() <= Date.now()) {
        throw new Error("Expiration date must be in the future.");
      }
      return true;
    }),

  body("discount")
    .optional()
    .isNumeric()
    .withMessage("Discount value must be a number.")
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("Discount value must be between 0.01 and 100."),
  validatorMiddleware,
];

// Generic validators for checking a coupon ID format.
exports.getCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format."),
  validatorMiddleware,
];
exports.deleteCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon ID format."),
  validatorMiddleware,
];
