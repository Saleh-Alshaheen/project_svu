const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title is too short, must be at least 3 characters."],
      maxlength: [
        100,
        "Title is too long, must be shorter than 100 characters.",
      ],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      minlength: [
        20,
        "Description is too short, must be at least 20 characters.",
      ],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required."],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Product price is required."],
      trim: true,
      max: [200000, "Product price is too high."],
    },
    priceAfterDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          // 'this' points to the current document on NEW document creation.
          return value < this.price;
        },
        message: "Discount price must be lower than the regular price.",
      },
    },
    colors: [String],
    imageCover: {
      type: String,
      required: [true, "Product image cover is required."],
    },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to a category."],
    },
    subCategory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory",
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "Brand",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be at least 1.0"],
      max: [5, "Rating must be at most 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    // Ensure virtual properties are included when document is converted to JSON/Object.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Mongoose virtual property to populate reviews for a product.
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

// Mongoose 'pre' hook to automatically populate the category on any 'find' query.
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name -_id", // Select only the name field of the category.
  });
  next();
});

const setImageUrl = (doc) => {
  if (doc.imageCover) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const imageUrl = `${process.env.BASE_URL}/products/${image}`;
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};

// Mongoose 'post' hooks to attach the full image URLs after fetching or saving.
productSchema.post("init", (doc) => setImageUrl(doc));
productSchema.post("save", (doc) => setImageUrl(doc));

const ProductModel = mongoose.model("Product", productSchema);
module.exports = ProductModel;
