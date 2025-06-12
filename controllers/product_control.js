const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ProductModel = require("../models/product_model");
const factory = require("./handler_Factory");
const { uploadMixImages } = require("../Middlewares/UploadImage_middleware");

/**
 * @desc    Middleware to upload multiple product images (cover and gallery).
 */
exports.uploadProductImages = uploadMixImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

/**
 * @desc    Middleware to process and resize uploaded product images.
 */
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // 1) Process the image cover
  if (req.files.imageCover) {
    const coverFileName = `product-${uuidv4()}-${Date.now()}-cover.png`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(300, 228)
      .toFormat("png")
      .png({ quality: 90 })
      .toFile(`uploads/products/${coverFileName}`);
    req.body.imageCover = coverFileName;
  }

  // 2) Process the gallery images
  if (req.files.images) {
    req.body.images = [];
    // Use Promise.all to process all images in parallel for better performance.
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(img.buffer)
          .resize(800, 1000)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`uploads/products/${imageName}`);
        req.body.images.push(imageName);
      })
    );
  }
  next();
});

/**
 * @desc    Get a list of all products
 * @route   GET /api/v1/products
 * @access  Public
 */
exports.getProducts = factory.getAll(ProductModel, ["title", "description"]);

/**
 * @desc    Get a specific product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
exports.getProduct = factory.getOne(ProductModel, "reviews");

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private (Admin/Manager)
 */
exports.createProduct = factory.createOne(ProductModel);

/**
 * @desc    Update a specific product
 * @route   PUT /api/v1/products/:id
 * @access  Private (Admin/Manager)
 */
exports.updateProduct = factory.updateOne(ProductModel);

/**
 * @desc    Delete a specific product
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Admin/Manager)
 */
exports.deleteProduct = factory.deleteOne(ProductModel);
