const express = require("express");

const {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
  createFilterObj,
  setCategoryIdToBody,
} = require("../controllers/subcategory_control");

const {
  createSubCategoryValidator,
  getSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subcategory_validator");

const authControl = require("../controllers/auth_control");
// Import our reusable slugify middleware.
const { slugifyRequest } = require("../Middlewares/slugify_middleware");

// CRITICAL: mergeParams: true is essential for nested routes to access parent params.
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    setCategoryIdToBody, // 1. Set categoryId from params into body
    createSubCategoryValidator, // 2. Validate data
    slugifyRequest, // 3. Create slug from name
    createSubCategory // 4. Execute controller
  )
  .get(createFilterObj, getSubCategories);

router
  .route("/:id")
  .get(getSubCategoryValidator, getSubCategory)
  .put(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    updateSubCategoryValidator,
    slugifyRequest,
    updateSubCategory
  )
  .delete(
    authControl.protect,
    authControl.allowedTo("admin"),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;
