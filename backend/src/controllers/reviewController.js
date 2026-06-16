const Review = require("../models/Review");
const Business = require("../models/Business");

const updateBusinessRating = async (businessId) => {
  const result = await Review.aggregate([
    { $match: { business: businessId } },
    {
      $group: {
        _id: "$business",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    });
  } else {
    await Business.findByIdAndUpdate(businessId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { rating, comment } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const existingReview = await Review.findOne({
      business: businessId,
      user: req.user._id,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this business" });
    }

    const review = await Review.create({
      business: businessId,
      user: req.user._id,
      rating,
      comment,
    });

    await updateBusinessRating(business._id);
    await review.populate("user", "name profilePicture");

    res.status(201).json({ review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBusinessReviews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [reviews, total] = await Promise.all([
      Review.find({ business: businessId })
        .populate("user", "name profilePicture")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Review.countDocuments({ business: businessId }),
    ]);

    res.json({
      reviews,
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

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    await updateBusinessRating(review.business);
    await review.populate("user", "name profilePicture");

    res.json({ review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const businessId = review.business;
    await Review.findByIdAndDelete(req.params.id);
    await updateBusinessRating(businessId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
