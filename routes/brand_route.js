const express = require("express");

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../controllers/brand_control");

const {
  createBrandValidator,
  getBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validators/brand_validator");

const authControl = require("../controllers/auth_control");
// Import our reusable slugify middleware.
const { slugifyRequest } = require("../Middlewares/slugify_middleware");

const router = express.Router();

router.route("/").get(getBrands).post(
  // Middleware chain for creating a brand:
  authControl.protect,
  authControl.allowedTo("admin", "manager"),
  uploadBrandImage,
  resizeImage,
  createBrandValidator,
  slugifyRequest,
  createBrand
);

router
  .route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    authControl.protect,
    authControl.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    slugifyRequest,
    updateBrand
  )
  .delete(
    authControl.protect,
    authControl.allowedTo("admin"),
    deleteBrandValidator,
    deleteBrand
  );

module.exports = router;
