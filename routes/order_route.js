const express = require("express");

const {
  createOrderValidator,
  getOrderValidator,
  updateOrderToPaidValidator,
  updateOrderToDeliveredValidator,
} = require("../utils/validators/order_validator");

const {
  createCashOrder,
  filterOrdersForLoggedUser,
  getAllOrders,
  getSpecificOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  checkoutSession,
} = require("../controllers/order_control");

const authControl = require("../controllers/auth_control");

const router = express.Router();

// All order routes are protected and require a user to be logged in.
router.use(authControl.protect);

// Using POST is better for creating a session as it's an action.
router.post(
  "/checkout-session/:cartId",
  authControl.allowedTo("user"),
  createOrderValidator,
  checkoutSession
);

router.post(
  "/:cartId",
  authControl.allowedTo("user"),
  createOrderValidator,
  createCashOrder
);

router.get(
  "/",
  authControl.allowedTo("user", "admin", "manager"),
  filterOrdersForLoggedUser,
  getAllOrders
);

router
  .route("/:id")
  .get(
    authControl.allowedTo("user", "admin", "manager"),
    getOrderValidator,
    getSpecificOrder
  );

router.put(
  "/:id/pay",
  authControl.allowedTo("admin", "manager"),
  updateOrderToPaidValidator,
  updateOrderToPaid
);

router.put(
  "/:id/deliver",
  authControl.allowedTo("admin", "manager"),
  updateOrderToDeliveredValidator,
  updateOrderToDelivered
);

module.exports = router;
