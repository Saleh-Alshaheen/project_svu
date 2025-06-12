// Import multer for handling multipart/form-data, used for file uploads.
const multer = require("multer");
// Import the custom ApiError class for structured error handling.
const ApiError = require("../utils/API_Errors");

/**
 * Creates and configures a multer instance for file uploads.
 * This factory function centralizes the storage, file filtering, and limit logic.
 * @returns {multer.Instance} A configured multer instance.
 */
const multerOptions = () => {
  // 1) Configure storage: Store the image in memory as a Buffer.
  // This is efficient for further processing (e.g., resizing) before saving to disk or a cloud service.
  const multerStorage = multer.memoryStorage();

  // 2) Configure file filter: Ensure only images are uploaded.
  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      // If the file is an image, accept it.
      cb(null, true);
    } else {
      // If not an image, reject it with a specific operational error.
      cb(new ApiError("Only image files are allowed.", 400), false);
    }
  };

  // 3) Create the multer instance with storage, filter, and resource limits.
  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    // Add a file size limit to prevent Denial-of-Service attacks via large file uploads.
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Megabyte limit
  });

  return upload;
};

/**
 * Creates middleware to handle a single image upload for a specific field.
 * @param {string} fieldName - The name of the form field that contains the image.
 * @returns {Function} Express middleware.
 */
exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

/**
 * Creates middleware to handle a mix of image uploads with specified fields and counts.
 * @param {Array<{name: string, maxCount: number}>} arrayOfFields - An array of objects specifying the field names and max counts.
 * @returns {Function} Express middleware.
 */
exports.uploadMixImages = (arrayOfFields) =>
  multerOptions().fields(arrayOfFields);
