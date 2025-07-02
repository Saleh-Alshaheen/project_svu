const mongoose = require("mongoose");
// 1. Import Cloudinary
const cloudinary = require("cloudinary").v2;

// 2. Configure Cloudinary inside the model file as well
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3],
      maxlength: [100],
    },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, required: true, minlength: [20] },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
    price: { type: Number, required: true, max: [200000] },
    priceAfterDiscount: { type: Number },
    colors: [String],
    imageCover: { type: String, required: true },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: [{ type: mongoose.Schema.ObjectId, ref: "SubCategory" }],
    brand: { type: mongoose.Schema.ObjectId, ref: "Brand" },
    ratingsAverage: { type: Number, min: [1], max: [5] },
    ratingsQuantity: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name -_id",
  });
  next();
});

// --- 3. This function now builds Cloudinary URLs ---
const setCloudinaryImageUrl = (doc) => {
  if (doc.imageCover) {
    // doc.imageCover holds the public_id from Cloudinary (e.g., 'products/product-123-abc-cover')
    // cloudinary.url() generates the full, public URL.
    doc.imageCover = cloudinary.url(doc.imageCover);
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      // Each 'image' in the array is a public_id from Cloudinary.
      imagesList.push(cloudinary.url(image));
    });
    doc.images = imagesList;
  }
};

// The post hooks now call our new Cloudinary function.
productSchema.post("init", (doc) => setCloudinaryImageUrl(doc));
productSchema.post("save", (doc) => setCloudinaryImageUrl(doc));

const ProductModel = mongoose.model("Product", productSchema);
module.exports = ProductModel;
