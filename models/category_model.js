const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary inside the model file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 32,
    },
    slug: { type: String, lowercase: true },
    // This field now stores the Cloudinary public_id
    image: String,
  },
  { timestamps: true }
);

// This function now builds a Cloudinary URL
const setImageUrl = (doc) => {
  if (doc.image) {
    // The cloudinary.url() method generates the full, public URL from the public_id
    doc.image = cloudinary.url(doc.image);
  }
};

// The post hooks remain the same, but now call the updated function
categorySchema.post("init", (doc) => setImageUrl(doc));
categorySchema.post("save", (doc) => setImageUrl(doc));

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;
