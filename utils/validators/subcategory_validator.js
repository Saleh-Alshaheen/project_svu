const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");

// Validation rules for GET / DELETE requests on a specific subcategory.
exports.getSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid SubCategory ID format."),
  validatorMiddleware,
];

// Validation rules for creating a new subcategory.
exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("SubCategory name is required.")
    .isLength({ min: 2, max: 32 })
    .withMessage("Name must be between 2 and 32 characters."),

  check("category")
    .notEmpty()
    .withMessage("Subcategory must belong to a parent category.")
    .isMongoId()
    .withMessage("Invalid Category ID format."),
  validatorMiddleware,
];

// Validation rules for updating an existing subcategory.
exports.updateSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid SubCategory ID format."),
  body("name")
    .optional()
    .isLength({ min: 2, max: 32 })
    .withMessage("Name must be between 2 and 32 characters."),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid Category ID format."),
  validatorMiddleware,
];

// Validation rules for deleting a subcategory.
exports.deleteSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid SubCategory ID format."),
  validatorMiddleware,
];
