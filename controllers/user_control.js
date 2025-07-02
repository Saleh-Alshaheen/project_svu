const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");
const UserModel = require("../models/user_model");
const ApiError = require("../utils/API_Errors");
const createToken = require("../utils/create_token");

// ---> 1. Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Middleware to upload a single user profile image.
 */
exports.uploadUserImage = uploadSingleImage("profileImage");

/**
 * @desc    Middleware to process the user's profile image and upload it to Cloudinary.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // ---> 2. Rewritten image processing logic for Cloudinary
  const publicId = `user-${uuidv4()}-${Date.now()}`;
  const buffer = await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat("png")
    .png({ quality: 90 })
    .toBuffer();

  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, folder: "users" },
      (error, result) => {
        if (error) return reject(error);
        req.body.profileImage = result.public_id;
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

  next();
});

/**
 * @desc    Get a list of all users
 */
exports.getUsers = factory.getAll(UserModel, ["name", "email", "phone"]);

/**
 * @desc    Get a specific user by ID
 */
exports.getUser = factory.getOne(UserModel);

/**
 * @desc    Create a new user (Admin)
 */
exports.createUser = factory.createOne(UserModel);

/**
 * @desc    Update a specific user (Admin)
 */
exports.updateUser = factory.updateOne(UserModel);

/**
 * @desc    Change a specific user's password (Admin)
 */
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.body;
  const user = await UserModel.findById(id);
  if (!user) {
    return next(new ApiError(`No user found for ID: ${id}`, 404));
  }
  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();
  res
    .status(200)
    .json({ status: "Success", message: "Password updated successfully." });
});

/**
 * @desc    Delete a specific user (Admin)
 */
exports.deleteUser = factory.deleteOne(UserModel);

// --- Routes for Logged-in User ---

/**
 * @desc    Middleware to attach the logged-in user's ID to the request params.
 */
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

/**
 * @desc    Update password for the currently logged-in user.
 */
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id);
  user.password = req.body.password;
  user.passwordChangedAt = Date.now();
  await user.save();
  const token = createToken(user._id);
  res.status(200).json({ status: "Success", token });
});

/**
 * @desc    Update profile data for the currently logged-in user.
 */
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      // ---> 3. Ensure profileImage can be updated
      profileImage: req.body.profileImage,
    },
    { new: true, runValidators: true }
  );
  res.status(200).json({ data: updatedUser });
});

/**
 * @desc    Deactivate the currently logged-in user's account (Soft Delete).
 */
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await UserModel.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).send();
});
