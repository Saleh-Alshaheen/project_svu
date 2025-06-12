const { check } = require("express-validator");
const validatorMiddleware = require("../../Middlewares/validator_middleware");
const UserModel = require("../../models/user_model");

exports.addAddressValidator = [
  check("alias")
    .notEmpty()
    .withMessage('Alias is required for the address (e.g., "Home", "Work").')
    .trim()
    // Custom validator to ensure the alias is unique for this user.
    .custom(async (value, { req }) => {
      const user = await UserModel.findById(req.user._id);
      if (user && user.addresses.some((address) => address.alias === value)) {
        return Promise.reject(
          new Error(
            `The alias '${value}' already exists. Please use a different alias.`
          )
        );
      }
      return true;
    }),

  check("details")
    .notEmpty()
    .withMessage("Address details are required.")
    .trim(),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required for the address.")
    .isMobilePhone(["ar-SY"])
    .withMessage("Invalid phone number format."),

  check("city").notEmpty().withMessage("City is required.").trim(),
  check("postalCode").optional().trim(),
  validatorMiddleware,
];

exports.removeAddressValidator = [
  // This checks the URL parameter for a valid Mongo ID.
  check("addressId").isMongoId().withMessage("Invalid Address ID format."),
  validatorMiddleware,
];
