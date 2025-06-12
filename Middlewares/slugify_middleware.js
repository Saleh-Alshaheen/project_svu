// Middlewares/slugify_middleware.js
const slugify = require("slugify");

/**
 * @desc    A generic middleware to create a slug from either a 'name' or 'title'
 * field in the request body.
 */
exports.slugifyRequest = (req, res, next) => {
  // Check for 'name' or 'title' to slugify.
  const fieldToSlugify = req.body.name || req.body.title;
  if (fieldToSlugify) {
    req.body.slug = slugify(fieldToSlugify, { lower: true });
  }
  next();
};
