const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const CategoryModel = require("../models/category_model");
const factory = require("./handler_Factory");
const { uploadSingleImage } = require("../Middlewares/UploadImage_middleware");

/**
 * @desc    Middleware to upload a single category image.
 */
exports.uploadCategoryImage = uploadSingleImage("image");

/**
 * @desc    Middleware to process (resize) the uploaded category image.
 */
exports.resizeImage = asyncHandler(async (req, res, next) => {
  // Proceed only if a file was uploaded.
  if (req.file) {
    // Generate a unique filename to prevent conflicts.
    const filename = `category-${uuidv4()}-${Date.now()}.png`;

    await sharp(req.file.buffer)
      .resize(140, 80) // Resize to a standard dimension.
      .toFormat("png")
      .png({ quality: 90 }) // Set compression quality.
      .toFile(`uploads/categories/${filename}`); // Save to the correct folder.

    // Save the filename to the request body to be stored in the database.
    req.body.image = filename;
  }
  next();
});

/**
 * @desc    Get a list of all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
exports.getCategories = factory.getAll(CategoryModel, ["name"]);

/**
 * @desc    Get a specific category by ID
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
exports.getCategory = factory.getOne(CategoryModel);

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private (Admin/Manager)
 */
exports.createCategory = factory.createOne(CategoryModel);

/**
 * @desc    Update a specific category
 * @route   PUT /api/v1/categories/:id
 * @access  Private (Admin/Manager)
 */
exports.updateCategory = factory.updateOne(CategoryModel);

/**
 * @desc    Delete a specific category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private (Admin/Manager)
 */
exports.deleteCategory = factory.deleteOne(CategoryModel);
