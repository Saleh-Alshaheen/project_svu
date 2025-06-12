const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");
const UserModel = require("../models/user_model");
const ApiError = require("../utils/API_Errors");
const createToken = require("../utils/create_token");

/**
 * @desc    Middleware to upload a single user profile image.
 */
exports.uploadUserImage = uploadSingleImage("profileImage");

/**
 * @desc    Middleware to process (resize and format) the uploaded user image.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  // Generate a unique filename.
  const filename = `user-${uuidv4()}-${Date.now()}.png`;

  // Process the image: resize to 400x400, convert to png with quality 90.
  await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat("png")
    .png({ quality: 90 })
    .toFile(`uploads/users/${filename}`);

  //Save the filename to req.body with the correct field name ('profileImage').
  req.body.profileImage = filename;
  next();
});

/**
 * @desc    Get a list of all users
 * @route   GET /api/v1/users
 * @access  Private (Admin)
 */
// Use the refactored factory correctly by passing searchable fields.
exports.getUsers = factory.getAll(UserModel, ["name", "email", "phone"]);

/**
 * @desc    Get a specific user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private (Admin)
 */
exports.getUser = factory.getOne(UserModel);

/**
 * @desc    Create a new user (Admin)
 * @route   POST /api/v1/users
 * @access  Private (Admin)
 */
// Use the updated factory function name 'createOne'.
exports.createUser = factory.createOne(UserModel);

/**
 * @desc    Update a specific user (Admin)
 * @route   PUT /api/v1/users/:id
 * @access  Private (Admin)
 */
// Replaced custom handler with the consistent and safe factory function.
exports.updateUser = factory.updateOne(UserModel);

/**
 * @desc    Change a specific user's password (Admin)
 * @route   PUT /api/v1/users/changePassword/:id
 * @access  Private (Admin)
 */
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.body;

  // 1) Find user by ID.
  const user = await UserModel.findById(id);
  if (!user) {
    return next(new ApiError(`No user found for ID: ${id}`, 404));
  }

  // 2) Update password and save. The 'pre-save' hook will handle hashing automatically.
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  res
    .status(200)
    .json({ status: "Success", message: "Password updated successfully." });
});

/**
 * @desc    Delete a specific user (Admin)
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Admin)
 */
// Use the updated factory function name 'deleteOne'.
exports.deleteUser = factory.deleteOne(UserModel);

// --- Routes for Logged-in User ---

/**
 * @desc    A middleware to attach the logged-in user's ID to the request params.
 * This allows us to reuse the generic 'getOne' factory.
 */
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

/**
 * @desc    Update password for the currently logged-in user.
 * @route   PUT /api/v1/users/updateMyPassword
 * @access  Private (Logged-in User)
 */
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1) Find user by their ID from the protect middleware.
  const user = await UserModel.findById(req.user._id);

  // 2) Update password and save. The 'pre-save' hook handles hashing.
  user.password = req.body.password;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 3) Generate a new token and send it with the response.
  const token = createToken(user._id);
  res.status(200).json({ status: "Success", token });
});

/**
 * @desc    Update profile data for the currently logged-in user.
 * @route   PUT /api/v1/users/updateMyData
 * @access  Private (Logged-in User)
 */
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      // Only allow updating non-sensitive fields.
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({ data: updatedUser });
});

/**
 * @desc    Deactivate the currently logged-in user's account (Soft Delete).
 * @route   DELETE /api/v1/users/deleteMyData
 * @access  Private (Logged-in User)
 */
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await UserModel.findByIdAndUpdate(req.user._id, { active: false });

  // BUG FIX: 204 No Content response must not have a body.
  res.status(204).send();
});
