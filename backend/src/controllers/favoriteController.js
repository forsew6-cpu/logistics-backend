const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
  try {
    const { businessId } = req.params;

    const existing = await Favorite.findOne({
      user: req.user._id,
      business: businessId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      business: businessId,
    });

    await favorite.populate("business");
    res.status(201).json({ favorite });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [favorites, total] = await Promise.all([
      Favorite.find({ user: req.user._id })
        .populate({
          path: "business",
          populate: { path: "owner", select: "name profilePicture" },
        })
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Favorite.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      favorites,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      business: req.params.businessId,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      business: req.params.businessId,
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
