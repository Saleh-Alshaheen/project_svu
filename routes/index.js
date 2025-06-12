// Import all the individual router modules for each feature.
const categoryRoute = require("./category_route");
const subCategoryRoute = require("./subcategory_route");
const brandRoute = require("./brand_route");
const productRoute = require("./product_route");
const userRoute = require("./user_route");
const authRoute = require("./auth_route");
const reviewRoute = require("./review_route");
const wishlistRoute = require("./wishlist_route");
const addressesRoute = require("./address_route");
const couponRoute = require("./coupon_route");
const cartRoute = require("./cart_route");
const orderRoute = require("./order_route");

/**
 * @description A function to mount all API routes into the main Express app.
 * This centralizes route management and keeps the main server file clean.
 * @param {import('express').Application} app - The Express application instance.
 */
const mountRoutes = (app) => {
  // Mount each router on its designated base path.
  app.use("/api/v1/categories", categoryRoute);
  app.use("/api/v1/subcategories", subCategoryRoute);
  app.use("/api/v1/brands", brandRoute);
  app.use("/api/v1/products", productRoute);
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/reviews", reviewRoute);
  app.use("/api/v1/wishlist", wishlistRoute);
  app.use("/api/v1/addresses", addressesRoute);
  app.use("/api/v1/coupons", couponRoute);
  app.use("/api/v1/cart", cartRoute);
  app.use("/api/v1/orders", orderRoute);
};

module.exports = mountRoutes;
