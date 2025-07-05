// Built-in Node.js module for handling file paths.
const path = require("path");
const cors = require("cors");
const compression = require("compression");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

const sanitizeInput = require("./Middlewares/sanitizer_middleware");
const packageJson = require("./package.json");

dotenv.config({ path: "config.env" });

const dbConnect = require("./config/database");
const mountRoutes = require("./routes");
const ApiError = require("./utils/API_Errors");
const globalErrorHandler = require("./Middlewares/error_middleware");
const { webhookCheckout } = require("./controllers/order_control");

dbConnect();
const app = express();

// --- Global Middlewares (in order) ---

app.use(helmet({ crossOriginResourcePolicy: false }));

// ---> 1. IMPLEMENT ROBUST CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:3000",
  "https://ourproject1.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("This origin is not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200, // For legacy browser support
};

// Apply the new CORS options
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight requests for all routes

app.use(compression());
app.use(mongoSanitize());

app.post(
  "/webhook-stripe",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

app.use(express.json({ limit: "1000kb" }));
app.use(sanitizeInput);

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

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`Mode: ${process.env.NODE_ENV}`);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000, // Corrected to a reasonable limit
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the E-Commerce API!",
    version: packageJson.version,
    documentation_url:
      "https://github.com/Saleh-Alshaheen/project_svu/blob/main/README.md",
  });
});

mountRoutes(app);

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

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
