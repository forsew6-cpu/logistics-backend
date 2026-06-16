const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);
router.get("/businesses", adminController.getAllBusinesses);
router.put("/businesses/:id/toggle", adminController.toggleBusinessActive);
router.delete("/reviews/:id", adminController.deleteReview);

module.exports = router;
