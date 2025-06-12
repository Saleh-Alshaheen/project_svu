const mongoose = require("mongoose");

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
    const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
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
