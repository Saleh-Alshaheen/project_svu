const mongoose = require("mongoose");

// Define the schema for the Category model.
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: [true, "The category name must be unique."],
      minlength: [3, "Name is too short, must be at least 3 characters."],
      maxlength: [30, "Name is too long, must be shorter than 30 characters."],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    // Stores the filename of the category image, e.g., 'category-12345.png'
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
  // Only add the image URL if an image filename exists in the document.
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
    doc.image = imageUrl;
  }
};

// Mongoose 'post' hook that runs after a document is initialized (e.g., via find).
// This transforms the image path to a full URL before sending it in a response.
categorySchema.post("init", (doc) => {
  setImageUrl(doc);
});

// Mongoose 'post' hook that runs after a document is saved (create/update).
// This ensures the returned document also has the full image URL.
categorySchema.post("save", (doc) => {
  setImageUrl(doc);
});

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;
