const express = require("express");

const {
  createReviewValidator,
  getReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require("../utils/validators/review_validator");

const {
  getReview,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  createFilterObj,
  setProductIdAndUserIdToBody,
} = require("../controllers/review_control");

const authControl = require("../controllers/auth_control");

// mergeParams: true is essential for nested routes to access parent params (e.g., :productId).
const router = express.Router({ mergeParams: true });

router.route("/").get(createFilterObj, getReviews).post(
  // Middleware chain for creating a review:
  authControl.protect,
  authControl.allowedTo("user"),
  setProductIdAndUserIdToBody,
  createReviewValidator,
  createReview
);

router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put(
    authControl.protect,
    authControl.allowedTo("user"),
    updateReviewValidator,
    updateReview
  )
  .delete(
    authControl.protect,
    // Users can delete their own reviews; Admins/Managers can delete any.
    authControl.allowedTo("user", "manager", "admin"),
    deleteReviewValidator,
    deleteReview
  );

module.exports = router;
