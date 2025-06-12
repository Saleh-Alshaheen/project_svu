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
  // When the cart contents change, any previously applied discount is invalidated.
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

  // 1) Get the user's cart, or create a new one if it doesn't exist.
  let cart = await CartModel.findOne({ user: req.user._id });

  if (!cart) {
    cart = await CartModel.create({
      user: req.user._id,
      cartItems: [{ product: productId, color, price: product.price }],
    });
  } else {
    // 2) Check if the product (with the same color) already exists in the cart.
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );

    if (productIndex > -1) {
      // If it exists, increment the quantity.
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // If not, push a new item to the cart.
      cart.cartItems.push({ product: productId, color, price: product.price });
    }
  }

  // 3) Recalculate total price and save the cart.
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
 * @route   GET /api/v1/cart
 * @access  Private (User)
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
 * @route   DELETE /api/v1/cart/:itemId
 * @access  Private (User)
 */
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const cart = await CartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  );

  // Recalculate total price after removing an item.
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
 * @route   DELETE /api/v1/cart
 * @access  Private (User)
 */
exports.clearCart = asyncHandler(async (req, res, next) => {
  await CartModel.findOneAndDelete({ user: req.user._id });
  // A 204 response must not have a body.
  res.status(204).send();
});

/**
 * @desc    Update a specific cart item's quantity.
 * @route   PUT /api/v1/cart/:itemId
 * @access  Private (User)
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
 * @route   PUT /api/v1/cart/applyCoupon
 * @access  Private (User)
 */
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Find coupon by name and check if it's valid and not expired.
  const coupon = await CouponModel.findOne({
    name: req.body.coupon.toUpperCase(),
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired.`, 404));
  }

  // 2) Get user's cart and apply the discount.
  const cart = await CartModel.findOne({ user: req.user._id });
  const totalPrice = cart.totalCartPrice;

  // Calculate as a number, not a string.
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
