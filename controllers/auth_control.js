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
 * @description Creates a sanitized user object safe for sending in responses.
 * @param {object} userDoc - The Mongoose user document.
 * @returns {object} A user object without sensitive information.
 */
const sanitizeUserForResponse = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  delete user.passwordChangedAt;
  delete user.passwordResetCode;
  delete user.passwordResetExpire;
  delete user.passwordResetVerified;
  return user;
};

/**
 * @desc    User signup
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
exports.signup = asyncHandler(async (req, res, next) => {
  // 1) Create slug from the user's name.
  req.body.slug = slugify(req.body.name);

  // 2) Create user. Password hashing is handled by a pre-save hook in the model.
  const user = await userModel.create(req.body);

  // 3) Generate a JWT for the new user.
  const token = createToken(user._id);

  // 4) Send the response with a sanitized user object.
  res.status(201).json({ data: sanitizeUserForResponse(user), token });
});

/**
 * @desc    User login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  // 1) Check if user exists and if password is correct.
  const user = await userModel.findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password.", 401));
  }

  // 2) Generate a new JWT for the logged-in user.
  const token = createToken(user._id);

  // 3) Send response with a sanitized user object.
  res.status(200).json({ data: sanitizeUserForResponse(user), token });
});

/**
 * @desc    Authentication middleware to protect routes.
 * Verifies the JWT and checks if the user still exists.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exists in the headers.
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

  // 2) Verify the token. Our global error handler will catch any errors.
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) Check if the user associated with the token still exists.
  const currentUser = await userModel.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ApiError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 4) Check if user changed password after the token was issued.
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
  // Grant access and attach user to the request object.
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

  // The password hashing is handled by a pre-save hook in the user model.
  user.password = req.body.newPassword;

  user.passwordChangedAt = Date.now();
  user.passwordResetCode = undefined;
  user.passwordResetExpire = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  // Generate a new token and send it in the response.
  const token = createToken(user._id);
  res.status(200).json({ token });
});
