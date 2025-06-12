const express = require("express");
const authControl = require("../controllers/auth_control");
const {
  addToWishlistValidator,
  removeFromWishlistValidator,
} = require("../utils/validators/wishlist_validator");
const {
  addProductToWishlist,
  removeProductFromWishlist,
  getLoggedUserWishlist,
} = require("../controllers/wishlist_control");

const router = express.Router();

// All routes in this file are protected and scoped to the 'user' role.
router.use(authControl.protect, authControl.allowedTo("user"));

router
  .route("/")
  .post(addToWishlistValidator, addProductToWishlist)
  .get(getLoggedUserWishlist);

router.delete(
  "/:productId",
  removeFromWishlistValidator,
  removeProductFromWishlist
);

module.exports = router;
