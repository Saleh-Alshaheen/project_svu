const mongoose = require("mongoose");

// Define the schema for the Coupon model.
const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Coupon name is required."],
      unique: [true, "The coupon name must be unique."],
    },
    expire: {
      type: Date,
      required: [true, "Coupon expiration date is required."],
    },
    discount: {
      type: Number,
      required: [true, "Coupon discount value is required."],
    },
  },
  // Automatically adds createdAt and updatedAt timestamps.
  { timestamps: true }
);

/**
 * Mongoose 'pre-save' hook to convert the coupon name to uppercase before saving.
 * This ensures that coupon codes are case-insensitive (e.g., 'WINTER25' is the same as 'winter25').
 */
couponSchema.pre("save", function (next) {
  this.name = this.name.toUpperCase();
  next();
});

const CouponModel = mongoose.model("Coupon", couponSchema);

module.exports = CouponModel;
