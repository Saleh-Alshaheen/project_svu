const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/API_Errors"); // Corrected name
const factory = require("./handler_Factory");
const ProductModel = require("../models/product_model");
const CartModel = require("../models/cart_model");
const UserModel = require("../models/user_model");
const OrderModel = require("../models/order_model");

/**
 * @desc    Create a new order with cash payment using a transaction.
 */
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cart = await CartModel.findById(req.params.cartId);
    if (!cart) {
      throw new ApiError(
        `There is no cart with this ID: ${req.params.cartId}`,
        404
      );
    }
    const cartPrice = cart.totalPriceAfterDiscount
      ? cart.totalPriceAfterDiscount
      : cart.totalCartPrice;
    const totalOrderPrice = cartPrice; // Assuming 0 tax/shipping

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
    )[0];

    if (!order) {
      throw new ApiError("Failed to create the order.", 500);
    }

    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await ProductModel.bulkWrite(bulkOption, { session });

    await CartModel.findByIdAndDelete(req.params.cartId, { session });

    await session.commitTransaction();
    res.status(201).json({ status: "Success", data: order });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    A helper function to create an order from a Stripe session object, wrapped in a transaction.
 */
const createCardOrder = async (sessionData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cartId = sessionData.client_reference_id;
    const shippingAddress = sessionData.metadata;
    const orderPrice = sessionData.amount_total / 100;
    const cart = await CartModel.findById(cartId);
    const user = await UserModel.findOne({ email: sessionData.customer_email });

    const order = (
      await OrderModel.create(
        [
          {
            user: user._id,
            cartItems: cart.cartItems,
            shippingAddress,
            totalOrderPrice: orderPrice,
            paymentMethod: "card",
            isPaid: true,
            paidAt: Date.now(),
          },
        ],
        { session }
      )
    )[0];

    if (!order) {
      // This will trigger the catch block and abort the transaction.
      throw new Error("Failed to create order from webhook.");
    }

    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await ProductModel.bulkWrite(bulkOption, { session });
    await CartModel.findByIdAndDelete(cartId, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    // Even if it fails, we don't want Stripe to retry indefinitely.
    // We log the error for manual intervention.
    console.error(
      `Failed to create card order for cart ${sessionData.client_reference_id}`,
      err
    );
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Stripe webhook handler.
 */
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    console.log("✅ Checkout session completed, fulfilling order...");
    // Await the order creation before sending a response to Stripe.
    await createCardOrder(event.data.object);
  }

  res.status(200).json({ received: true });
});

// --- Other Factory-based Handlers ---

exports.filterOrdersForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") {
    req.filterObj = { user: req.user._id };
  }
  next();
});

exports.getAllOrders = factory.getAll(OrderModel);
exports.getSpecificOrder = factory.getOne(OrderModel);

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

exports.checkoutSession = asyncHandler(async (req, res, next) => {
  const cart = await CartModel.findById(req.params.cartId).populate(
    "cartItems.product"
  );
  if (!cart) {
    return next(
      new ApiError(`No cart found with ID: ${req.params.cartId}`, 404)
    );
  }
  const session = await stripe.checkout.sessions.create({
    line_items: cart.cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
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
  res.status(200).json({ status: "Success", session });
});
