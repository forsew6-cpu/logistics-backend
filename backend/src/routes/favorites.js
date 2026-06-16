const express = require("express");
const { protect } = require("../middleware/auth");
const favoriteController = require("../controllers/favoriteController");

const router = express.Router();

router.get("/", protect, favoriteController.getFavorites);
router.post("/:businessId", protect, favoriteController.addFavorite);
router.delete("/:businessId", protect, favoriteController.removeFavorite);
router.get("/check/:businessId", protect, favoriteController.checkFavorite);

module.exports = router;
