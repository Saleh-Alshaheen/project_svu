// routes/auth_route.js
const express = require("express");

const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/auth_validator");

const {
  signup,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/auth_control");

const router = express.Router();

router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/forgotPassword", forgotPasswordValidator, forgotPassword);
router.post("/verifyResetCode", verifyResetCodeValidator, verifyResetCode);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

module.exports = router;
