const asyncHandler = require("express-async-handler");
const UserModel = require("../models/user_model");

/**
 * @desc    Add a new address to the logged-in user's address list.
 * @route   POST /api/v1/addresses
 * @access  Private (User)
 */
exports.addAddress = asyncHandler(async (req, res, next) => {
  // Use $addToSet to add the new address to the 'addresses' array.
  // This operator ensures no duplicate address objects are added.
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addresses: req.body },
    },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Address added successfully.",
    data: user.addresses,
  });
});

/**
 * @desc    Remove an address from the logged-in user's address list.
 * @route   DELETE /api/v1/addresses/:addressId
 * @access  Private (User)
 */
exports.removeAddress = asyncHandler(async (req, res, next) => {
  // Use $pull to remove an address from the array by its specific _id.
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addresses: { _id: req.params.addressId } },
    },
    { new: true }
  );

  res.status(200).json({
    status: "Success",
    message: "Address removed successfully.",
    data: user.addresses,
  });
});

/**
 * @desc    Get all addresses for the logged-in user.
 * @route   GET /api/v1/addresses
 * @access  Private (User)
 */
exports.getLoggedUserAddresses = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id);
  // .populate('addresses') removed as it's unnecessary for embedded documents.

  res.status(200).json({
    status: "Success",
    results: user.addresses.length,
    data: user.addresses,
  });
});
