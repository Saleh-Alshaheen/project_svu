const express = require("express");

const {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../utils/validators/coupon_validator");

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/coupon_control");

const authControl = require("../controllers/auth_control");

const router = express.Router();

// All routes in this file are protected and restricted to Admins and Managers.
router.use(authControl.protect, authControl.allowedTo("admin", "manager"));

// Routes for getting all coupons and creating a new one.
router.route("/").get(getCoupons).post(createCouponValidator, createCoupon);

// Routes for getting, updating, and deleting a specific coupon by ID.
router
  .route("/:id")
  .get(getCouponValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(deleteCouponValidator, deleteCoupon);

module.exports = router;
