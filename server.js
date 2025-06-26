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

const { rateLimit } = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

// ---> 1. IMPORT helmet
const helmet = require("helmet");

const sanitizeInput = require("./Middlewares/sanitizer_middleware");
const packageJson = require("./package.json");

dotenv.config({ path: "config.env" });

// Import custom modules from our application structure.
const dbConnect = require("./config/database");
const mountRoutes = require("./routes");
const ApiError = require("./utils/API_Errors");
const globalErrorHandler = require("./Middlewares/error_middleware");
const { webhookCheckout } = require("./controllers/order_control");

// Establish connection to the database.
dbConnect();

// Initialize the Express application.
const app = express();

// --- Global Middlewares (in order) ---

// 2. Set security headers as the very first middleware.
app.use(helmet());

// Enable Cross-Origin Resource Sharing for all routes.
app.use(cors());
app.options("*", cors());
app.use(compression());

// Sanitize data to prevent NoSQL query injection.
app.use(mongoSanitize());

// Special route for Stripe webhook must come BEFORE express.json()
app.post(
  "/webhook-stripe",
  express.raw({ type: "application/json" }), // Use raw body parser for this route only
  webhookCheckout
);

// Parse incoming JSON payloads.
app.use(express.json({ limit: "1000kb" }));

// Sanitize user input from potential XSS attacks.
app.use(sanitizeInput);

// Protect against HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: [
      "price",
      "sold",
      "quantity",
      "ratingsAverage",
      "ratingsQuantity",
      "colors",
    ],
  })
);
app.use(express.static(path.join(__dirname, "uploads")));

// Use Morgan for HTTP request logging only in the development environment.
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`Mode: ${process.env.NODE_ENV}`);
}

// Apply the rate limiting middleware to all API requests.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// --- API Root Endpoint ---
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the E-Commerce API!",
    version: packageJson.version,
    documentation_url:
      "https://github.com/Saleh-Alshaheen/project_svu/blob/main/README.md",
  });
});

// --- Mount All Application Routes ---
mountRoutes(app);

// --- Error Handling Middlewares (must be last) ---
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down application...`);
    process.exit(1);
  });
});
