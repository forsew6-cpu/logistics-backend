const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

router.get("/business/:businessId", reviewController.getBusinessReviews);

router.post(
  "/business/:businessId",
  protect,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validate,
  reviewController.createReview
);

router.put(
  "/:id",
  protect,
  [
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Comment cannot be empty"),
  ],
  validate,
  reviewController.updateReview
);

router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
