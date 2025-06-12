const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const ProductModel = require("../../models/product_model");
const CartModel = require("../../models/cart_model");

// Validation rules for adding a product to the cart.
exports.addProductToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product ID is required.")
    .isMongoId()
    .withMessage("Invalid Product ID format.")
    // Custom validator to ensure the product exists before adding it.
    .custom(async (val) => {
      const product = await ProductModel.findById(val);
      if (!product) {
        return Promise.reject(new Error(`No product found for ID: ${val}`));
      }
      return true;
    }),

  check("color").optional().isString().withMessage("Color must be a string."),
  validatorMiddleware,
];

// Validation rules for removing a specific item from the cart.
exports.removeSpecificCartItemValidator = [
  check("itemId")
    .notEmpty()
    .withMessage("Item ID is required.")
    .isMongoId()
    .withMessage("Invalid Item ID format.")
    // Custom validator to ensure the item exists in the user's cart before attempting to remove it.
    .custom(async (val, { req }) => {
      const cart = await CartModel.findOne({ user: req.user._id });
      if (cart) {
        const itemExists = cart.cartItems.some(
          (item) => item._id.toString() === val
        );
        if (!itemExists) {
          return Promise.reject(
            new Error(`No item found with ID: ${val} in your cart.`)
          );
        }
      } else {
        return Promise.reject(new Error("No cart found for this user."));
      }
      return true;
    }),
  validatorMiddleware,
];

// Validation rules for updating an item's quantity in the cart.
exports.updateCartItemQuantityValidator = [
  check("itemId")
    .notEmpty()
    .withMessage("Item ID is required.")
    .isMongoId()
    .withMessage("Invalid Item ID format."),

  check("quantity")
    .notEmpty()
    .withMessage("Quantity is required.")
    .isNumeric({ no_symbols: true })
    .withMessage("Quantity must be a number.")
    // Ensure quantity is a positive integer.
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1."),
  validatorMiddleware,
];

// Validation rules for applying a coupon.
exports.applyCouponValidator = [
  check("coupon")
    .notEmpty()
    .withMessage("Coupon code is required.")
    .isString()
    .withMessage("Coupon code must be a string.")
    // Sanitize to uppercase to ensure case-insensitive matching in the controller.
    .trim()
    .toUpperCase(),
  validatorMiddleware,
];
