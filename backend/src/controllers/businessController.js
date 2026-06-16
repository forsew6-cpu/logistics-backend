const Business = require("../models/Business");

exports.createBusiness = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      contactPhone,
      contactEmail,
      website,
      openingHours,
      address,
      longitude,
      latitude,
    } = req.body;

    const images = req.files
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];

    const business = await Business.create({
      name,
      category,
      description,
      contactPhone,
      contactEmail,
      website,
      images,
      openingHours: openingHours ? JSON.parse(openingHours) : [],
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address,
      owner: req.user._id,
    });

    res.status(201).json({ business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBusinesses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      lng,
      lat,
      distance,
      sort = "-createdAt",
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;

    if (search) {
      query.$text = { $search: search };
    }

    if (lng && lat && distance) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(distance, 10),
        },
      };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate("owner", "name profilePicture")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Business.countDocuments(query),
    ]);

    res.json({
      businesses,
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

exports.getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate(
      "owner",
      "name profilePicture"
    );

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json({ business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (
      business.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = { ...req.body };
    if (updates.openingHours && typeof updates.openingHours === "string") {
      updates.openingHours = JSON.parse(updates.openingHours);
    }
    if (updates.longitude && updates.latitude) {
      updates.location = {
        type: "Point",
        coordinates: [
          parseFloat(updates.longitude),
          parseFloat(updates.latitude),
        ],
      };
      delete updates.longitude;
      delete updates.latitude;
    }
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      updates.images = [...(business.images || []), ...newImages];
    }

    const updated = await Business.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("owner", "name profilePicture");

    res.json({ business: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (
      business.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Business.findByIdAndDelete(req.params.id);
    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getNearbyBusinesses = async (req, res) => {
  try {
    const { lng, lat, distance = 5000, limit = 50 } = req.query;

    if (!lng || !lat) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const businesses = await Business.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(distance, 10),
        },
      },
    })
      .populate("owner", "name profilePicture")
      .limit(parseInt(limit, 10));

    res.json({ businesses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
