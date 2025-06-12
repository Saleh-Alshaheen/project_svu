const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");
const BrandModel = require("../models/brand_model");

/**
 * @desc    Middleware to upload a single brand image.
 */
exports.uploadBrandImage = uploadSingleImage("image");

/**
 * @desc    Middleware to process (resize) the uploaded brand image.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `brand-${uuidv4()}-${Date.now()}.png`;

  await sharp(req.file.buffer)
    .resize(200, 170)
    .toFormat("png")
    .png({ quality: 90 })
    .toFile(`uploads/brands/${filename}`);

  // Save the filename to the request body to be stored in the database.
  req.body.image = filename;
  next();
});

/**
 * @desc    Get a list of all brands
 * @route   GET /api/v1/brands
 * @access  Public
 */
exports.getBrands = factory.getAll(BrandModel, ["name"]);

/**
 * @desc    Get a specific brand by ID
 * @route   GET /api/v1/brands/:id
 * @access  Public
 */
exports.getBrand = factory.getOne(BrandModel);

/**
 * @desc    Create a new brand
 * @route   POST /api/v1/brands
 * @access  Private (Admin/Manager)
 */
exports.createBrand = factory.createOne(BrandModel);

/**
 * @desc    Update a specific brand
 * @route   PUT /api/v1/brands/:id
 * @access  Private (Admin/Manager)
 */
exports.updateBrand = factory.updateOne(BrandModel);

/**
 * @desc    Delete a specific brand
 * @route   DELETE /api/v1/brands/:id
 * @access  Private (Admin/Manager)
 */
exports.deleteBrand = factory.deleteOne(BrandModel);
