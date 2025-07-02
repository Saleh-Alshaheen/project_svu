const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2; // Import Cloudinary here as well

// Define the schema for the Brand model.
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required."],
      unique: [true, "The brand name must be unique."],
      minlength: [3, "Name is too short, must be at least 3 characters."],
      // Corrected the validation message to be consistent.
      maxlength: [32, "Name is too long, must be shorter than 32 characters."],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    // Stores the filename of the brand image.
    image: String,
  },
  // Automatically adds createdAt and updatedAt timestamps.
  { timestamps: true }
);

/**
 * @description A function to transform the stored image filename into a full URL.
 * @param {object} doc - The Mongoose document.
 */
const setImageUrl = (doc) => {
  if (doc.image) {
    // Build the Cloudinary URL using its SDK
    // The doc.image now holds the public_id, e.g., 'brands/brand-123-456'
    const imageUrl = cloudinary.url(doc.image, {});
    doc.image = imageUrl;
  }
};

// Mongoose 'post' hook that runs after finding a document to attach the full image URL.
brandSchema.post("init", (doc) => {
  setImageUrl(doc);
});

// Mongoose 'post' hook that runs after saving a document to attach the full image URL.
brandSchema.post("save", (doc) => {
  setImageUrl(doc);
});

const BrandModel = mongoose.model("Brand", brandSchema);

module.exports = BrandModel;
