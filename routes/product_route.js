// routes/product_route.js
const express = require("express");

const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/product_validator");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
} = require("../controllers/product_control");

const authControl = require("../controllers/auth_control");
// ---> 1. TYPO FIX: Import 'slugifyRequest' instead of 'slugifyName'
const { slugifyRequest } = require("../Middlewares/slugify_middleware");
const { arrayify } = require("../Middlewares/transform_middleware");
const reviewRoute = require("./review_route");

const router = express.Router();

router.use("/:productId/reviews", reviewRoute);

router.route("/").get(getProducts).post(
  authControl.protect,
  authControl.allowedTo("admin", "manager"),
  uploadProductImages,
  resizeProductImages,
  arrayify("colors", "subCategory"),
  createProductValidator,
  // ---> 2. USE the corrected function name here
  slugifyRequest,
  createProduct
);

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    arrayify("colors", "subCategory"),
    updateProductValidator,
    // ---> 3. AND USE the corrected function name here for updates
    slugifyRequest,
    updateProduct
  )
  .delete(
    authControl.protect,
    authControl.allowedTo("admin"),
    deleteProductValidator,
    deleteProduct
  );

module.exports = router;
