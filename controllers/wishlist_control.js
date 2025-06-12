const asyncHandler = require("express-async-handler");
const UserModel = require("../models/user_model");

/**
 * @desc    Add a product to the logged-in user's wishlist.
 * @route   POST /api/v1/wishlist
 * @access  Private (User)
 */
exports.addProductToWishlist = asyncHandler(async (req, res, next) => {
  // Use $addToSet to add a productId to the wishlist array.
  // This efficiently prevents the same product from being added multiple times.
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { wishlist: req.body.productId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Product added successfully to your wishlist.",
    data: user.wishlist,
  });
});

/**
 * @desc    Remove a product from the logged-in user's wishlist.
 * @route   DELETE /api/v1/wishlist/:productId
 * @access  Private (User)
 */
exports.removeProductFromWishlist = asyncHandler(async (req, res, next) => {
  // Use $pull to remove the productId from the wishlist array.
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { wishlist: req.params.productId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Product removed successfully from your wishlist.",
    data: user.wishlist,
  });
});

/**
 * @desc    Get the wishlist for the currently logged-in user.
 * @route   GET /api/v1/wishlist
 * @access  Private (User)
 */
exports.getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
  // Find the user and populate the 'wishlist' field to get full product details.
  const user = await UserModel.findById(req.user._id).populate("wishlist");

  res.status(200).json({
    status: "Success",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});
