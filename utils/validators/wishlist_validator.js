const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const ProductModel = require("../../models/product_model");

// Validation rules for adding a product to the wishlist.
exports.addToWishlistValidator = [
  check("productId")
    .isMongoId()
    .withMessage("Invalid Product ID format.")
    // Custom validator to ensure the product exists in the database.
    .custom(async (val) => {
      const product = await ProductModel.findById(val);
      if (!product) {
        return Promise.reject(
          new Error(`No product found for this ID: ${val}`)
        );
      }
    }),
  validatorMiddleware,
];

// Validation rules for removing a product from the wishlist.
exports.removeFromWishlistValidator = [
  check("productId").isMongoId().withMessage("Invalid Product ID format."),
  validatorMiddleware,
];
