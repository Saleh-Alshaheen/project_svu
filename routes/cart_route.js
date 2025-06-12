const express = require("express");

const {
  addProductToCartValidator,
  removeSpecificCartItemValidator,
  updateCartItemQuantityValidator,
  applyCouponValidator,
} = require("../utils/validators/cart_validator");

const {
  addProductToCart,
  getLoggedUserCart,
  removeSpecificCartItem,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} = require("../controllers/cart_control");

const authControl = require("../controllers/auth_control");

const router = express.Router();

// All cart routes are protected and restricted to logged-in users.
router.use(authControl.protect, authControl.allowedTo("user"));

router
  .route("/")
  .post(addProductToCartValidator, addProductToCart)
  .get(getLoggedUserCart)
  .delete(clearCart); // DELETE /api/v1/cart - Clears the entire cart.

router.put("/applyCoupon", applyCouponValidator, applyCoupon);

router
  .route("/:itemId")
  .put(updateCartItemQuantityValidator, updateCartItemQuantity)
  .delete(removeSpecificCartItemValidator, removeSpecificCartItem);

module.exports = router;
