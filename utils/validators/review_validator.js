const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const ReviewModel = require("../../models/review_model");

// Validation rules for creating a new review.
exports.createReviewValidator = [
  check("text").optional(),
  check("ratings")
    .notEmpty()
    .withMessage("Ratings value is required.")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1.0 and 5.0"),

  check("product")
    .notEmpty()
    .withMessage("Product ID is required.")
    .isMongoId()
    .withMessage("Invalid Product ID format.")
    // Custom validator to check if the user has already reviewed this product.
    .custom((val, { req }) =>
      ReviewModel.findOne({
        user: req.user._id,
        product: req.body.product,
      }).then((review) => {
        if (review) {
          return Promise.reject(
            new Error("You have already submitted a review for this product.")
          );
        }
      })
    ),
  validatorMiddleware,
];

// Generic validator for checking a review ID format.
exports.getReviewValidator = [
  check("id").isMongoId().withMessage("Invalid Review ID format."),
  validatorMiddleware,
];

// For updating, we only need to validate the ID format and optional fields.
// Ownership will be checked in the controller.
exports.updateReviewValidator = [
  check("id").isMongoId().withMessage("Invalid Review ID format."),
  check("ratings")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1.0 and 5.0"),
  validatorMiddleware,
];

// For deleting, we only need to validate the ID format.
// Ownership will be checked in the controller.
exports.deleteReviewValidator = [
  check("id").isMongoId().withMessage("Invalid Review ID format."),
  validatorMiddleware,
];
