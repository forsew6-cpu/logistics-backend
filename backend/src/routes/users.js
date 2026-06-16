const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const userController = require("../controllers/userController");

const router = express.Router();

router.put(
  "/profile",
  protect,
  [body("name").optional().trim().notEmpty().withMessage("Name cannot be empty")],
  validate,
  userController.updateProfile
);

router.post(
  "/profile/picture",
  protect,
  upload.single("profilePicture"),
  userController.uploadProfilePicture
);

router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validate,
  userController.changePassword
);

module.exports = router;
