// Import the jsonwebtoken library for creating and verifying JWTs.
const jwt = require("jsonwebtoken");

/**
 * Creates and signs a new JSON Web Token (JWT).
 * @param {string} userId - The unique identifier for the user to include in the token payload.
 * @returns {string} The generated JWT.
 */
const createToken = (userId) =>
  // jwt.sign() creates the token.
  jwt.sign(
    // 1. Payload: The data to embed in the token. We embed the userId under an 'id' key.
    { id: userId },
    // 2. Secret: The secret key used for the signature, loaded from environment variables for security.
    process.env.JWT_SECRET_KEY,
    // 3. Options: Configuration for the token, like its expiration time.
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );

module.exports = createToken;
