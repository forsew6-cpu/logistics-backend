const mongoose = require("mongoose");

const openingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Restaurant",
        "Retail",
        "Healthcare",
        "Education",
        "Entertainment",
        "Services",
        "Technology",
        "Fitness",
        "Beauty",
        "Automotive",
        "Real Estate",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 2000,
    },
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    images: [{ type: String }],
    openingHours: [openingHoursSchema],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
      },
    },
    address: { type: String, required: [true, "Address is required"] },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

businessSchema.index({ location: "2dsphere" });
businessSchema.index({ name: "text", description: "text" });
businessSchema.index({ category: 1 });

module.exports = mongoose.model("Business", businessSchema);
