const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");

// Validation rules for GET / DELETE requests on a specific brand.
exports.getBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand ID format."),
  validatorMiddleware,
];

// Validation rules for creating a new brand.
exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand name is required.")
    .isLength({ min: 3, max: 32 })
    .withMessage("Brand name must be between 3 and 32 characters."),
  validatorMiddleware,
];

// Validation rules for updating an existing brand.
exports.updateBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand ID format."),
  body("name")
    .optional()
    .isLength({ min: 3, max: 32 })
    .withMessage("Brand name must be between 3 and 32 characters."),
  validatorMiddleware,
];

// Validation rules for deleting a brand.
exports.deleteBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand ID format."),
  validatorMiddleware,
];
