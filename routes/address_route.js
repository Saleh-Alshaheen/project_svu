const express = require("express");
const authControl = require("../controllers/auth_control");
const {
  addAddressValidator,
  removeAddressValidator,
} = require("../utils/validators/address_validator");
const {
  addAddress,
  removeAddress,
  getLoggedUserAddresses,
} = require("../controllers/address_control");

const router = express.Router();

// All routes in this file are protected and scoped to the 'user' role.
router.use(authControl.protect, authControl.allowedTo("user"));

router
  .route("/")
  .post(addAddressValidator, addAddress)
  .get(getLoggedUserAddresses);

router.delete("/:addressId", removeAddressValidator, removeAddress);

module.exports = router;
