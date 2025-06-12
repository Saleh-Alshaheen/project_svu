// Import Node.js built-in file system module.
const fileSystem = require("fs");
// Import 'colors' to add color to console output for better readability.
require("colors");
// Import 'dotenv' to load environment variables from a .env file.
const dotenv = require("dotenv");
// Import the Mongoose model for products.
const productModel = require("../../models/product_model");
// Import the database connection function.
const dbConnection = require("../../config/database");

// Configure dotenv to load variables from the specified path.
dotenv.config({ path: "../../config.env" });

// Establish the connection to the database.
dbConnection();

// Read the product data from the JSON file synchronously and parse it.
const products = JSON.parse(fileSystem.readFileSync("./products.json"));

/**
 * @desc    Inserts the product data from the JSON file into the database.
 */
const insertData = async () => {
  try {
    // Use the model to create all product documents from the array.
    await productModel.create(products);
    console.log("Data Inserted".green.inverse);
    // Exit the Node.js process successfully.
    process.exit(0);
  } catch (error) {
    console.error(error);
    // Exit with an error code to signal failure.
    process.exit(1);
  }
};

/**
 * @desc    Deletes all documents from the products collection.
 */
const destroyData = async () => {
  try {
    // Use deleteMany with an empty filter to delete all documents.
    await productModel.deleteMany();
    console.log("Data Destroyed".red.inverse);
    // Exit the Node.js process successfully.
    process.exit(0);
  } catch (error) {
    console.error(error);
    // Exit with an error code to signal failure.
    process.exit(1);
  }
};

// Check the command-line arguments to decide which function to run.
// process.argv[2] is the first argument passed after the script name (e.g., 'node script.js -i').
if (process.argv[2] === "-i") {
  insertData();
} else if (process.argv[2] === "-d") {
  destroyData();
} else {
  // Provide feedback for invalid commands.
  console.log(
    "Invalid command. Use -i to insert data or -d to destroy data.".yellow
  );
  process.exit();
}
