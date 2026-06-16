const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const businessController = require("../controllers/businessController");

const router = express.Router();

router.get("/", businessController.getBusinesses);
router.get("/nearby", businessController.getNearbyBusinesses);
router.get("/:id", businessController.getBusiness);

router.post(
  "/",
  protect,
  upload.array("images", 5),
  [
    body("name").trim().notEmpty().withMessage("Business name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("longitude").notEmpty().withMessage("Longitude is required"),
    body("latitude").notEmpty().withMessage("Latitude is required"),
  ],
  validate,
  businessController.createBusiness
);

router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  businessController.updateBusiness
);

router.delete("/:id", protect, businessController.deleteBusiness);

module.exports = router;
