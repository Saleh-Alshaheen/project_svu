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
const { slugifyRequest } = require("../Middlewares/slugify_middleware");
const reviewRoute = require("./review_route");

const router = express.Router();

// Nested route for reviews specific to a product.
router.use("/:productId/reviews", reviewRoute);

router
  .route("/")
  .get(getProducts)
  .post(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    createProductValidator,
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
    updateProductValidator,
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
