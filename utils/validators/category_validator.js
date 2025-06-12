const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");

// Validation rules for GET / DELETE requests on a specific category.
exports.getCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category ID format."),
  validatorMiddleware,
];

// Validation rules for creating a new category.
exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required.")
    .isLength({ min: 3, max: 32 })
    .withMessage("Name must be between 3 and 32 characters."),
  validatorMiddleware,
];

// Validation rules for updating an existing category.
exports.updateCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category ID format."),
  body("name")
    .optional()
    .isLength({ min: 3, max: 32 })
    .withMessage("Name must be between 3 and 32 characters."),
  validatorMiddleware,
];

// Validation rules for deleting a category.
exports.deleteCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category ID format."),
  validatorMiddleware,
];
