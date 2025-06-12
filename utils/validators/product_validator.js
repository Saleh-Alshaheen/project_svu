const { check, body } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const CategoryModel = require("../../models/category_model");
const SubCategoryModel = require("../../models/subcategory_model");

// Validation rules for GET / DELETE requests on a specific product.
exports.getProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID format."),
  validatorMiddleware,
];

// Validation rules for creating a new product.
exports.createProductValidator = [
  check("title")
    .notEmpty()
    .withMessage("Product title is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters."),

  check("description")
    .notEmpty()
    .withMessage("Product description is required.")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters long."),

  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required.")
    .isNumeric()
    .withMessage("Product quantity must be a number."),

  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product sold count must be a number."),

  check("price")
    .notEmpty()
    .withMessage("Product price is required.")
    .isNumeric()
    .withMessage("Product price must be a number."),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Discount price must be a number.")
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error("Discount price must be lower than the regular price.");
      }
      return true;
    }),

  check("colors")
    .optional()
    .isArray()
    .withMessage("Available colors should be an array of strings."),

  check("imageCover")
    .notEmpty()
    .withMessage("Product image cover is required."),

  check("images")
    .optional()
    .isArray()
    .withMessage("Images should be an array of strings."),

  check("category")
    .notEmpty()
    .withMessage("Product must belong to a category.")
    .isMongoId()
    .withMessage("Invalid category ID format.")
    .custom((categoryId) =>
      CategoryModel.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category found for this ID: ${categoryId}`)
          );
        }
      })
    ),

  check("subCategory")
    .optional()
    .isArray()
    .withMessage("Subcategories must be an array of IDs.")
    .isMongoId()
    .withMessage("Invalid SubCategory ID format.")
    .custom((subCategoryIds) =>
      SubCategoryModel.find({ _id: { $in: subCategoryIds } }).then((result) => {
        if (result.length < 1 || result.length !== subCategoryIds.length) {
          return Promise.reject(new Error(`Invalid SubCategory ID(s) found.`));
        }
      })
    )
    .custom((subCategoryIds, { req }) =>
      SubCategoryModel.find({ category: req.body.category }).then(
        (subcategories) => {
          const subCategoryIdsInDB = subcategories.map((sub) =>
            sub._id.toString()
          );
          const checker = (target, arr) => target.every((v) => arr.includes(v));
          if (!checker(subCategoryIds, subCategoryIdsInDB)) {
            return Promise.reject(
              new Error(`Subcategories do not belong to the main category.`)
            );
          }
        }
      )
    ),

  check("brand").optional().isMongoId().withMessage("Invalid brand ID format."),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("Ratings average must be a number.")
    .isLength({ min: 1, max: 5 })
    .withMessage("Rating must be between 1.0 and 5.0"),

  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("Ratings quantity must be a number."),

  validatorMiddleware,
];

exports.updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID format."),
  body("title").optional(),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid product ID format."),
  validatorMiddleware,
];
