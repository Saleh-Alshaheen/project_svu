// Import the nodemailer library, the standard for sending emails in Node.js.
const nodemailer = require("nodemailer");

/**
 * Sends an email using nodemailer with error handling.
 * The transport configuration and 'from' address are loaded from environment variables.
 * @param {object} options - The email options.
 * @param {string} options.email - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.message - The plain text body of the email.
 * @returns {Promise<void>} A promise that resolves when the email is sent.
 * @throws {Error} Throws an error if the email fails to send.
 */
const sendEmail = async (options) => {
  // 1) Create a transporter object using SMTP transport.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, // Note: port 465 is typically used with secure: true.
    secure: true, // Use true for port 465, false for other ports like 587.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options.
  const mailOptions = {
    from: `E-Shop Syrian <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Consider adding an `html: options.html` property for richer email content.
  };

  // 3) Send the email and handle potential errors.
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Log the detailed error for debugging purposes on the server.
    console.error("Error sending email:", error);
    // Throw a generic error to be caught by the calling function.
    // This prevents the application from crashing and allows for a user-friendly response.
    throw new Error(
      "There was an error sending the email, please try again later."
    );
  }
};

module.exports = sendEmail;
