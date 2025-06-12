const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const CartModel = require("../../models/cart_model");

// A reusable validator for any route that needs to check for a valid cart.
exports.createOrderValidator = [
  // Check that the cartId is a valid Mongo ID.
  check("cartId")
    .isMongoId()
    .withMessage("Invalid Cart ID format.")
    // Custom validator to check the state of the cart itself.
    .custom(async (val) => {
      const cart = await CartModel.findById(val);
      if (!cart) {
        // Use Promise.reject for async validation errors.
        return Promise.reject(new Error(`No cart found for this ID: ${val}`));
      }
      if (cart.cartItems.length === 0) {
        return Promise.reject(
          new Error("Cart is empty. Cannot create an order.")
        );
      }
      return true;
    }),

  // Validate nested fields within the shippingAddress object if present.
  check("shippingAddress").optional(),
  check("shippingAddress.details")
    .optional()
    .notEmpty()
    .withMessage("Shipping address details are required."),
  check("shippingAddress.phone")
    .optional()
    .notEmpty()
    .withMessage("Shipping address phone number is required.")
    .isMobilePhone(["ar-SY"])
    .withMessage("Invalid phone number format for shipping address."),
  check("shippingAddress.city")
    .optional()
    .notEmpty()
    .withMessage("Shipping address city is required."),
  check("shippingAddress.postalCode")
    .optional()
    .isPostalCode("any")
    .withMessage("Invalid postal code format."),
  validatorMiddleware,
];

// Generic validator for any route that uses an order ID in its params.
exports.getOrderValidator = [
  check("id").isMongoId().withMessage("Invalid Order ID format."),
  validatorMiddleware,
];

exports.updateOrderToPaidValidator = [
  check("id").isMongoId().withMessage("Invalid Order ID format."),
  validatorMiddleware,
];

exports.updateOrderToDeliveredValidator = [
  check("id").isMongoId().withMessage("Invalid Order ID format."),
  validatorMiddleware,
];
