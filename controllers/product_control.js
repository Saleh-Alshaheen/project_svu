const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;
const ProductModel = require("../models/product_model");
const factory = require("./handler_Factory");
const { uploadMixImages } = require("../Middlewares/UploadImage_middleware");

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Middleware to accept multiple product images (cover and gallery).
 */
exports.uploadProductImages = uploadMixImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

/**
 * @desc    Middleware to process images and upload them to Cloudinary.
 */
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // 1) Process and upload the image cover
  if (req.files.imageCover) {
    const publicId = `product-${uuidv4()}-${Date.now()}-cover`;

    const coverBuffer = await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { public_id: publicId, folder: "products" },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );
      uploadStream.end(coverBuffer);
    });

    req.body.imageCover = result.public_id;
  }

  // 2) Process and upload the gallery images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const publicId = `product-${uuidv4()}-${Date.now()}-${index + 1}`;

        const imageBuffer = await sharp(img.buffer)
          .resize(800, 1000)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { public_id: publicId, folder: "products/gallery" },
            (error, uploadResult) => {
              if (error) return reject(error);
              resolve(uploadResult);
            }
          );
          uploadStream.end(imageBuffer);
        });

        req.body.images.push(result.public_id);
      })
    );
  }
  next();
});

// --- Factory-based handlers remain the same ---
exports.getProducts = factory.getAll(ProductModel, ["title", "description"]);
exports.getProduct = factory.getOne(ProductModel, "reviews");
exports.createProduct = factory.createOne(ProductModel);
exports.updateProduct = factory.updateOne(ProductModel);
exports.deleteProduct = factory.deleteOne(ProductModel);
