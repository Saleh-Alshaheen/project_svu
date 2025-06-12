const SubCategoryModel = require("../models/subcategory_model");
const factory = require("./handler_Factory");

/**
 * @desc    Middleware to set the parent category ID in the request body.
 * Used for creating subcategories via nested routes (e.g., POST /api/v1/categories/:categoryId/subcategories).
 * This allows the generic createOne factory to work without modification.
 */
exports.setCategoryIdToBody = (req, res, next) => {
  // If the category is not in the body, take it from the URL parameters.
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

/**
 * @desc    Middleware to create a filter object based on the parent category ID.
 * Used for getting a list of subcategories for a specific category
 * (e.g., GET /api/v1/categories/:categoryId/subcategories).
 */
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  // If a categoryId is present in the URL params, create a filter for it.
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  // Attach the filter object to the request to be used by the getAll factory.
  req.filterObj = filterObject;
  next();
};

/**
 * @desc    Get a list of all subcategories
 * @route   GET /api/v1/subcategories
 * @access  Public
 */
exports.getSubCategories = factory.getAll(SubCategoryModel, ["name"]);

/**
 * @desc    Get a specific subcategory by ID
 * @route   GET /api/v1/subcategories/:id
 * @access  Public
 */
exports.getSubCategory = factory.getOne(SubCategoryModel);

/**
 * @desc    Create a new subcategory
 * @route   POST /api/v1/subcategories
 * @access  Private (Admin/Manager)
 */
exports.createSubCategory = factory.createOne(SubCategoryModel);

/**
 * @desc    Update a specific subcategory
 * @route   PUT /api/v1/subcategories/:id
 * @access  Private (Admin/Manager)
 */
exports.updateSubCategory = factory.updateOne(SubCategoryModel);

/**
 * @desc    Delete a specific subcategory
 * @route   DELETE /api/v1/subcategories/:id
 * @access  Private (Admin/Manager)
 */
exports.deleteSubCategory = factory.deleteOne(SubCategoryModel);
