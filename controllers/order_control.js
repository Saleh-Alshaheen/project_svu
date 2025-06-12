const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/API_Errors");
const factory = require("./handler_Factory");
const ProductModel = require("../models/product_model");
const CartModel = require("../models/cart_model");
const OrderModel = require("../models/order_model");

/**
 * @desc    Create a new order with cash payment.
 * @route   POST /api/v1/orders/:cartId
 * @access  Private (User)
 */
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // 1. Start a new Mongoose session.
  const session = await mongoose.startSession();
  // 2. Start a transaction on that session.
  session.startTransaction();

  try {
    // Get cart based on cartId
    const cart = await CartModel.findById(req.params.cartId);
    if (!cart) {
      throw new ApiError(
        `There is no cart with this ID: ${req.params.cartId}`,
        404
      );
    }

    // Calculate order price
    const cartPrice = cart.totalPriceAfterDiscount
      ? cart.totalPriceAfterDiscount
      : cart.totalCartPrice;
    const taxPrice = 0;
    const shippingPrice = 0;
    const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

    // 3. Create the order. IMPORTANT: Pass the { session } option.
    // Note: create() expects an array when used with a session.
    const order = (
      await OrderModel.create(
        [
          {
            user: req.user._id,
            cartItems: cart.cartItems,
            shippingAddress: req.body.shippingAddress,
            totalOrderPrice,
          },
        ],
        { session }
      )
    )[0]; // Get the first (and only) element from the created array

    if (!order) {
      throw new ApiError("Failed to create the order.", 500);
    }

    // 4. Update product inventory. IMPORTANT: Pass the { session } option.
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await ProductModel.bulkWrite(bulkOption, { session });

    // 5. Clear user's cart. IMPORTANT: Pass the { session } option.
    await CartModel.findByIdAndDelete(req.params.cartId, { session });

    // 6. If all operations were successful, commit the transaction.
    await session.commitTransaction();

    res.status(201).json({ status: "Success", data: order });
  } catch (error) {
    // 7. If any operation failed, abort the transaction.
    await session.abortTransaction();
    // Re-throw the error so our global error handler can catch it.
    throw error;
  } finally {
    // 8. Always end the session to release resources.
    session.endSession();
  }
});
/**
 * @desc    Middleware to filter orders for the currently logged-in user.
 */
exports.filterOrdersForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") {
    req.filterObj = { user: req.user._id };
  }
  next();
});

/**
 * @desc    Get all orders (Admins) or only user's orders (Users).
 * @route   GET /api/v1/orders
 * @access  Private (User, Admin, Manager)
 */
exports.getAllOrders = factory.getAll(OrderModel);

/**
 * @desc    Get a specific order.
 * @route   GET /api/v1/orders/:id
 * @access  Private (User, Admin, Manager)
 */
exports.getSpecificOrder = factory.getOne(OrderModel);

/**
 * @desc    Update order status to 'paid'.
 * @route   PUT /api/v1/orders/:id/pay
 * @access  Private (Admin, Manager)
 */
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await OrderModel.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(`No order found for this ID: ${req.params.id}`, 404)
    );
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  const updatedOrder = await order.save();
  res.status(200).json({ status: "Success", data: updatedOrder });
});

/**
 * @desc    Update order status to 'delivered'.
 * @route   PUT /api/v1/orders/:id/deliver
 * @access  Private (Admin, Manager)
 */
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await OrderModel.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(`No order found for this ID: ${req.params.id}`, 404)
    );
  }
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  const updatedOrder = await order.save();
  res.status(200).json({ status: "Success", data: updatedOrder });
});

/**
 * @desc    Get Stripe checkout session from a cart.
 * @route   GET /api/v1/orders/checkout-session/:cartId
 * @access  Private (User)
 */
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  // 1) Get cart
  const cart = await CartModel.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`No cart found with ID: ${req.params.cartId}`, 404)
    );
  }

  // 2) Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: cart.cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100, // Convert to cents
        product_data: {
          name: item.product.title,
        },
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/orders`,
    cancel_url: `${req.protocol}://${req.get("host")}/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: req.body.shippingAddress,
  });

  // 3) Send session to client
  res.status(200).json({ status: "Success", session });
});
