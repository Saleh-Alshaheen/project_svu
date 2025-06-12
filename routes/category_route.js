const express = require("express");
// Import the sub-category router to handle nested routes.
const subCategoriesRoute = require("./subcategory_route");

const {
  createCategoryValidator,
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validators/category_validator");

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} = require("../controllers/category_control");

const authControl = require("../controllers/auth_control");
// Import the new slugify middleware.
const { slugifyRequest } = require("../Middlewares/slugify_middleware");

const router = express.Router();

// Nested route: Any request to /:categoryId/subcategories will be handled by subCategoriesRoute.
router.use("/:categoryId/subCategories", subCategoriesRoute);

router.route("/").get(getCategories).post(
  // Middleware chain for creating a category:
  authControl.protect,
  authControl.allowedTo("admin", "manager"),
  uploadCategoryImage,
  resizeImage,
  createCategoryValidator,
  slugifyRequest,
  createCategory
);

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    slugifyRequest,
    updateCategory
  )
  .delete(
    authControl.protect,
    authControl.allowedTo("admin"),
    deleteCategoryValidator,
    deleteCategory
  );

module.exports = router;
