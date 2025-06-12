const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: [true, "The subcategory name must be unique."],
      minlength: [2, "Name is too short, must be longer than 2 characters ..!"],
      maxlength: [
        30,
        "Name is too long, should be shorter than 30 characters ..!",
      ],
    },

    slug: {
      type: String,
      lowercase: true,
    },

    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "The subcategory must be belong to parent category."],
    },
  },
  { timestamps: true }
);

const subCategoryModel = mongoose.model("SubCategory", subCategorySchema);

module.exports = subCategoryModel;
