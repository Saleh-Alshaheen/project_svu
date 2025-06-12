const mongoose = require("mongoose");
const ProductModel = require("./product_model");

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "Min rating value is 1.0"],
      max: [5, "Max rating value is 5.0"],
      required: [true, "Review ratings value is required."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product."],
    },
  },
  { timestamps: true }
);

// Mongoose 'pre' hook to populate the user's name on any 'find' query.
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name" });
  next();
});

/**
 * @description Static method to calculate the average rating and quantity for a given product.
 * @param {string} productId - The ID of the product to update.
 */
reviewSchema.statics.calcAverageRatingsAndQuantity = async function (
  productId
) {
  // The aggregation pipeline is a highly efficient way to perform calculations in the database.
  const result = await this.aggregate([
    // Stage 1: Get all reviews for a specific product.
    { $match: { product: productId } },
    // Stage 2: Group them to calculate the average ratings and total quantity.
    {
      $group: {
        _id: "product",
        avgRatings: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  // Update the product document with the new average and quantity.
  if (result.length > 0) {
    await ProductModel.findByIdAndUpdate(productId, {
      ratingsAverage: result[0].avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    // If no reviews exist, reset the product's rating fields.
    await ProductModel.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

// Mongoose 'post' hook that runs after a review is saved (created or updated).
reviewSchema.post("save", async function () {
  // `this.constructor` refers to the Review model.
  await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

// Mongoose 'post' hook that runs after a review is deleted.
// This ensures that when a review is deleted, the product's average rating is recalculated.
// We use findByIdAndDelete in our factory, so we need to hook into 'findOneAndDelete'.
reviewSchema.post("findOneAndDelete", async (doc) => {
  // `doc` is the document that was deleted.
  // It may be null if the document was not found, so we check if it exists.
  if (doc) {
    await doc.constructor.calcAverageRatingsAndQuantity(doc.product);
  }
});

const ReviewModel = mongoose.model("Review", reviewSchema);
module.exports = ReviewModel;
