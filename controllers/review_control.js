const asyncHandler = require("express-async-handler");
const factory = require("./handler_Factory");
const ReviewModel = require("../models/review_model");
const ApiError = require("../utils/API_Errors");

/**
 * @desc    Middleware to create a filter object for getting reviews of a specific product.
 */
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.productId) {
    filterObject = { product: req.params.productId };
  }
  req.filterObj = filterObject;
  next();
};

/**
 * @desc    Get a list of all reviews.
 */
exports.getReviews = factory.getAll(ReviewModel);

/**
 * @desc    Get a specific review by ID.
 */
exports.getReview = factory.getOne(ReviewModel);

/**
 * @desc    Middleware to set product and user IDs in the request body before creating a review.
 */
exports.setProductIdAndUserIdToBody = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

/**
 * @desc    Create a new review.
 */
exports.createReview = factory.createOne(ReviewModel);

/**
 * @desc    Update a specific review.
 * This is a custom handler because it needs to check for ownership.
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const review = await ReviewModel.findById(id);

  if (!review) {
    return next(new ApiError(`No review found with ID: ${id}`, 404));
  }

  // A user can only update their own review.
  if (review.user._id.toString() !== req.user._id.toString()) {
    return next(
      new ApiError("You are not allowed to perform this action", 403)
    );
  }

  // Update the review
  review.text = req.body.text || review.text;
  review.ratings = req.body.ratings || review.ratings;

  await review.save();

  res.status(200).json({ status: "Success", data: review });
});

/**
 * @desc    Delete a specific review.
 * This is a custom handler because it needs to check for ownership.
 */
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const review = await ReviewModel.findById(id);

  if (!review) {
    return next(new ApiError(`No review found with ID: ${id}`, 404));
  }

  // A user can delete their own review. Admins and managers can delete any review.
  if (
    req.user.role === "user" &&
    review.user._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new ApiError("You are not allowed to perform this action", 403)
    );
  }

  // This triggers the 'findOneAndDelete' hook in the model to recalculate ratings.
  await ReviewModel.findByIdAndDelete(id);

  res.status(204).send();
});
