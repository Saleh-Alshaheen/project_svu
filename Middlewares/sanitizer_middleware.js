const xss = require("xss");

/**
 * A recursive function to sanitize all string properties of an object.
 * This version uses Object.keys() to comply with modern best practices.
 * @param {object} obj - The object to sanitize (e.g., req.body).
 */
const sanitizeObject = (obj) => {
  // Get an array of the object's own keys and iterate over it.
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "string") {
      // The xss() function removes any harmful HTML/JS.
      obj[key] = xss(value);
    } else if (typeof value === "object" && value !== null) {
      // If the property is another object, recurse into it.
      sanitizeObject(value);
    }
  });
};

/**
 * @desc    Express middleware to sanitize req.body, req.query, and req.params.
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize the request body, query, and params.
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

module.exports = sanitizeInput;
