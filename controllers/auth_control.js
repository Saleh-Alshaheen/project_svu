// Built-in Node.js module for cryptographic functions.
const crypto = require("crypto");
// Middleware to handle errors in async Express routes without try-catch blocks.
const asyncHandler = require("express-async-handler");
// Used for verifying JWTs. Signing is handled by our createToken utility.
const jwt = require("jsonwebtoken");
// Library for hashing and comparing passwords.
const bcrypt = require("bcryptjs");
// Utility for creating a slug from a string.
const { default: slugify } = require("slugify");

// Updated imports to use our refactored, consistent utilities.
const ApiError = require("../utils/API_Errors");
const createToken = require("../utils/create_token");
const sendEmail = require("../utils/SendEmail");
const userModel = require("../models/user_model");

/**
 * @description Creates a simplified and optimal user object (DTO) for auth responses.
 * @param {object} user - The full Mongoose user document.
 * @returns {object} An object with only the essential user fields for the frontend.
 */
const createAuthResponseUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * @desc    User signup
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
exports.signup = asyncHandler(async (req, res, next) => {
  req.body.slug = slugify(req.body.name);
  const user = await userModel.create(req.body);
  const token = createToken(user._id);

  // Create a minimal user object for the response payload.
  const responseUser = createAuthResponseUser(user);

  // Send the optimized response.
  res.status(201).json({ data: responseUser, token });
});

/**
 * @desc    User login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password.", 401));
  }
  const token = createToken(user._id);

  // Create a minimal user object for the response payload.
  const responseUser = createAuthResponseUser(user);

  // Send the optimized response.
  res.status(200).json({ data: responseUser, token });
});

/**
 * @desc    Authentication middleware to protect routes.
 * Verifies the JWT and checks if the user still exists.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new ApiError("You are not logged in, please login to get access.", 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const currentUser = await userModel.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ApiError("The user belonging to this token no longer exists.", 401)
    );
  }

  if (currentUser.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passwordChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed password. Please log in again.",
          401
        )
      );
    }
  }
  req.user = currentUser;
  next();
});

/**
 * @desc    Authorization middleware (Role-based access control).
 * @param   {...string} roles - Roles that are allowed to access the route.
 */
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to perform this action.", 403)
      );
    }
    next();
  });

/**
 * @desc    Forgot password functionality
 * @route   POST /api/v1/auth/forgotPassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with that email address.`, 404));
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetCode = hashResetCode;
  user.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.passwordResetVerified = false;
  await user.save();

  const message = `Hi ${user.name},\nWe received a request to reset the password on your E-shop Account.\nYour password reset code is: ${resetCode}\nThis code is valid for 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password Reset Code",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpire = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError("There was an error sending the email.", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to your email." });
});

/**
 * @desc    Verify password reset code
 * @route   POST /api/v1/auth/verifyResetCode
 * @access  Public
 */
exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  const hashResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await userModel.findOne({
    passwordResetCode: hashResetCode,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError("Reset code is invalid or has expired.", 400));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: "Success" });
});

/**
 * @desc    Reset user password
 * @route   PUT /api/v1/auth/resetPassword
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with this email address.`, 404));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified.", 400));
  }

  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  user.passwordResetCode = undefined;
  user.passwordResetExpire = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  const token = createToken(user._id);
  res.status(200).json({ token });
});
