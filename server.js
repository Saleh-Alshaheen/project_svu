// Built-in Node.js module for handling file paths.
const path = require("path");
// Middleware to enable Cross-Origin Resource Sharing.
const cors = require("cors");
// Middleware to compress response bodies for better performance.
const compression = require("compression");
// The main Express framework.
const express = require("express");
// Utility to load environment variables from a .env file.
const dotenv = require("dotenv");
// Middleware for logging HTTP requests.
const morgan = require("morgan");

const packageJson = require("./package.json");

// Load environment variables from config.env file.
dotenv.config({ path: "config.env" });

// Import custom modules from our application structure.
const dbConnect = require("./config/database");
const mountRoutes = require("./routes");
const ApiError = require("./utils/API_Errors");
const globalErrorHandler = require("./Middlewares/error_middleware");

// Establish connection to the database.
dbConnect();

// Initialize the Express application.
const app = express();

// --- Middlewares ---

// Enable Cross-Origin Resource Sharing for all routes.
app.use(cors());
app.options("*", cors()); // Enable pre-flight requests for all routes.

// Compress all responses to reduce their size.
app.use(compression());

// Parse incoming JSON payloads.
app.use(express.json());

// Serve static files from the 'uploads' directory.
app.use(express.static(path.join(__dirname, "uploads")));

// Use Morgan for HTTP request logging only in the development environment.
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`Mode: ${process.env.NODE_ENV}`);
}

// --- API Root Endpoint ---
// A welcome route for the API root to provide basic info and guidance.
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the E-Commerce API!",
    // Dynamically get the version from package.json
    version: packageJson.version,
    // IMPORTANT: Update this URL to point to your actual GitHub repository
    documentation_url:
      "https://github.com/Saleh-Alshaheen/project_svu/blob/main/README.md",
    entryPoints: {
      products: "/api/v1/products",
      categories: "/api/v1/categories",
      brands: "/api/v1/brands",
      auth: "/api/v1/auth",
      cart: "/api/v1/cart",
    },
  });
});

// --- Mount All Application Routes ---
// A clean way to mount all routers from the routes/index.js file.
mountRoutes(app);

// --- Error Handling Middlewares ---

// Catch-all route for any requests that don't match the routes above.
// This creates a 404 Not Found error and passes it to the global error handler.
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// Use the global error handling middleware to catch all operational and programming errors.
app.use(globalErrorHandler);

// --- Start Server ---

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// --- Handle Unhandled Promise Rejections ---
// This is a safety net for any asynchronous errors that are not caught elsewhere.
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection Errors: ${err.name} | ${err.message}`);
  // Gracefully shut down the server instead of letting it crash abruptly.
  server.close(() => {
    console.error(`Shutting down application due to unhandled rejection...`);
    process.exit(1);
  });
});
