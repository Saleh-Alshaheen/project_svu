const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2; // 1. Import Cloudinary

// 2. Configure Cloudinary inside the model file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // This field now stores the Cloudinary public_id
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
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
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
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.passwordResetCode;
        delete ret.passwordResetExpire;
        delete ret.passwordResetVerified;
        return ret;
      },
    },
  }
);

// ---> 3. ADD a hook to generate the full image URL from Cloudinary
const setImageUrl = (doc) => {
  if (doc.profileImage) {
    // The cloudinary.url() method generates the full, public URL from the public_id
    doc.profileImage = cloudinary.url(doc.profileImage);
  }
};

// Apply the hook for find and save operations
userSchema.post("init", (doc) => setImageUrl(doc));
userSchema.post("save", (doc) => setImageUrl(doc));

/**
 * Mongoose 'pre-save' hook to hash the password before saving it to the database.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
