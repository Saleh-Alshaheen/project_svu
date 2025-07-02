const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;

const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");
const CategoryModel = require("../models/category_model");

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Middleware to upload a single category image.
 */
exports.uploadCategoryImage = uploadSingleImage("image");

/**
 * @desc    Middleware to process the image and upload it to Cloudinary.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const publicId = `category-${uuidv4()}-${Date.now()}`;

  // Process image and upload the resulting buffer to Cloudinary
  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "categories",
        transformation: [{ width: 600, height: 600, crop: "fill" }],
      },
      (error, result) => {
        if (error) return reject(error);
        // Save the Cloudinary public_id to the request body
        req.body.image = result.public_id;
        resolve(result);
      }
    );
    sharp(req.file.buffer).pipe(uploadStream);
  });

  next();
});

// --- Factory-based handlers remain the same ---
exports.getCategories = factory.getAll(CategoryModel, ["name"]);
exports.getCategory = factory.getOne(CategoryModel);
exports.createCategory = factory.createOne(CategoryModel);
exports.updateCategory = factory.updateOne(CategoryModel);
exports.deleteCategory = factory.deleteOne(CategoryModel);
