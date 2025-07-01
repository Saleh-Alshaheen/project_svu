const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/API_Errors");
const ProductModel = require("../models/product_model");
const CouponModel = require("../models/coupon_model");
const CartModel = require("../models/cart_model");

/**
 * @desc    Helper function to calculate the total price of all items in the cart.
 * @param   {object} cart - The user's cart document.
 */
const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });

  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
};

/**
 * @desc    Add a product to the user's cart.
 * @route   POST /api/v1/cart
 * @access  Private (User)
 */
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await ProductModel.findById(productId);

  // 1. Determine the correct price to use (discounted price if available, otherwise regular price).
  const productPrice = product.priceAfterDiscount || product.price;

  // 2. Get the user's cart, or create a new one if it doesn't exist.
  let cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    // Create a new cart with the first product.
    cart = await CartModel.create({
      user: req.user._id,
      // Use the calculated productPrice here.
      cartItems: [{ product: productId, color, price: productPrice }],
    });
  } else {
    // 3. If cart exists, check if the product (with the same color) already exists.
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );

    if (productIndex > -1) {
      // If it exists, increment the quantity.
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // If not, push a new item to the cart, using the calculated productPrice.
      cart.cartItems.push({ product: productId, color, price: productPrice });
    }
  }

  // 4. Recalculate total price and save the cart.
  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: "Success",
    message: "Product added successfully to your cart.",
    numberOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

/**
 * @desc    Get the logged-in user's cart.
 */
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await CartModel.findOne({ user: req.user._id }).populate({
    path: "cartItems.product",
    select: "title imageCover ratingsAverage",
  });

  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user: ${req.user._id}`, 404)
    );
  }

  res.status(200).json({
    status: "Success",
    numberOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

/**
 * @desc    Remove a specific item from the cart.
 */
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await CartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  );

  if (cart) {
    calcTotalCartPrice(cart);
    await cart.save();
  }

  res.status(200).json({
    status: "Success",
    message: "Product removed successfully from your cart.",
    data: cart,
  });
});

/**
 * @desc    Clear all items from the cart.
 */
exports.clearCart = asyncHandler(async (req, res, next) => {
  await CartModel.findOneAndDelete({ user: req.user._id });
  res.status(204).send();
});

/**
 * @desc    Update a specific cart item's quantity.
 */
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(
      new ApiError(`There is no cart for user: ${req.user._id}`, 404)
    );
  }

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (itemIndex > -1) {
    cart.cartItems[itemIndex].quantity = quantity;
  } else {
    return next(
      new ApiError(`No item found with this ID: ${req.params.itemId}`, 404)
    );
  }

  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: "Success",
    numberOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

/**
 * @desc    Apply a coupon to the user's cart.
 */
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await CouponModel.findOne({
    name: req.body.coupon.toUpperCase(),
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired.`, 404));
  }

  const cart = await CartModel.findOne({ user: req.user._id });
  const totalPrice = cart.totalCartPrice;

  const totalPriceAfterDiscount = parseFloat(
    (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2)
  );

  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: "Success",
    message: "Coupon applied successfully.",
    numberOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
