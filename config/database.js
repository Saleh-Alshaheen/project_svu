// Import the Mongoose library, a popular ODM for MongoDB.
const mongoose = require("mongoose");

/**
 * Establishes a connection to the MongoDB database using the URI from environment variables.
 */
const databaseConnection = () => {
  // mongoose.connect returns a promise.
  mongoose
    .connect(process.env.DB_URI)
    .then((con) => {
      // On a successful connection, log the host to the console.
      console.log(`Database Connected: ${con.connection.host}`);
    })
    .catch((err) => {
      // Handle database connection errors.
      console.error(`Database Connection Error: ${err.message}`);
      // Exit the process with a failure code (1) to prevent the app from running without a database.
      process.exit(1);
    });
};

// Export the function to be used in the main server file.
module.exports = databaseConnection;
