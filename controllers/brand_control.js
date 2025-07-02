// controllers/brand_control.js
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2; // Import Cloudinary

const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");
const BrandModel = require("../models/brand_model");

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Middleware to upload a single brand image.
 */
exports.uploadBrandImage = uploadSingleImage("image");

/**
 * @desc    Middleware to process and upload the brand image to Cloudinary.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Generate a unique public ID for the image in Cloudinary
  const publicId = `brand-${uuidv4()}-${Date.now()}`;

  // Process the image with Sharp and upload the buffer to Cloudinary
  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        // Optional: Apply transformations, place in a folder, etc.
        folder: "brands",
        transformation: [{ width: 600, height: 600, crop: "fill" }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        // Save the Cloudinary public_id to the request body.
        // We no longer save a filename, but the unique ID from Cloudinary.
        req.body.image = result.public_id;
        resolve(result);
      }
    );

    // Create a readable stream from the buffer and pipe it to Cloudinary
    sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("png")
      .png({ quality: 95 })
      .pipe(uploadStream);
  });

  next();
});

// The rest of your CRUD functions remain the same
exports.getBrands = factory.getAll(BrandModel, ["name"]);
exports.getBrand = factory.getOne(BrandModel);
exports.createBrand = factory.createOne(BrandModel);
exports.updateBrand = factory.updateOne(BrandModel);
exports.deleteBrand = factory.deleteOne(BrandModel);
