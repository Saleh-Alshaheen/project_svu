const factory = require("./handler_Factory");
const CouponModel = require("../models/coupon_model");

/**
 * @desc    Get a list of all coupons
 * @route   GET /api/v1/coupons
 * @access  Private (Admin/Manager)
 */
exports.getCoupons = factory.getAll(CouponModel, ["name"]);

/**
 * @desc    Get a specific coupon by ID
 * @route   GET /api/v1/coupons/:id
 * @access  Private (Admin/Manager)
 */
exports.getCoupon = factory.getOne(CouponModel);

/**
 * @desc    Create a new coupon
 * @route   POST /api/v1/coupons
 * @access  Private (Admin/Manager)
 */
exports.createCoupon = factory.createOne(CouponModel);

/**
 * @desc    Update a specific coupon
 * @route   PUT /api/v1/coupons/:id
 * @access  Private (Admin/Manager)
 */
exports.updateCoupon = factory.updateOne(CouponModel);

/**
 * @desc    Delete a specific coupon
 * @route   DELETE /api/v1/coupons/:id
 * @access  Private (Admin/Manager)
 */
exports.deleteCoupon = factory.deleteOne(CouponModel);
