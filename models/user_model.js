const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required."],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImage: String,
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters long."],
    },

    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpire: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Foreign key relationship to the Product model.
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    // Array of sub-documents for storing user addresses.
    addresses: [
      {
        alias: String,
        city: String,
        details: String,
        phone: String,
        postalCode: String,
      },
    ],
  },
  // Automatically adds createdAt and updatedAt fields.
  { timestamps: true }
);

/**
 * Mongoose 'pre-save' hook to hash the password before saving it to the database.
 * This hook only runs if the password field has been modified.
 */
userSchema.pre("save", async function (next) {
  // If the password wasn't modified, don't re-hash it.
  if (!this.isModified("password")) return next();

  // Hash the password with a salt round of 12 (a strong default).
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
