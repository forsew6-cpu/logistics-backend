require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Business = require("./models/Business");
const Review = require("./models/Review");
const Favorite = require("./models/Favorite");

const seedData = async () => {
  try {
    await connectDB();
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Business.deleteMany({}),
      Review.deleteMany({}),
      Favorite.deleteMany({}),
    ]);

    console.log("Creating users...");
    const plainPassword = "password123";

    const users = await User.create([
      {
        name: "Admin User",
        email: "admin@nearhub.com",
        password: plainPassword,
        role: "admin",
        bio: "Platform administrator",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: plainPassword,
        role: "user",
        bio: "Local food enthusiast and business owner",
      },
      {
        name: "Bob Wilson",
        email: "bob@example.com",
        password: plainPassword,
        role: "user",
        bio: "Tech entrepreneur in the Bay Area",
      },
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: plainPassword,
        role: "user",
        bio: "Fitness lover and wellness advocate",
      },
      {
        name: "Mike Brown",
        email: "mike@example.com",
        password: plainPassword,
        role: "user",
        bio: "Real estate agent and community builder",
      },
    ]);

    console.log("Creating businesses...");
    const businesses = await Business.create([
      {
        name: "The Urban Bistro",
        category: "Restaurant",
        description:
          "A cozy downtown restaurant serving farm-to-table cuisine with a modern twist. Our seasonal menu features locally sourced ingredients and creative cocktails.",
        contactPhone: "+1-555-0101",
        contactEmail: "info@urbanbistro.com",
        website: "https://urbanbistro.example.com",
        address: "123 Main Street, San Francisco, CA 94102",
        location: { type: "Point", coordinates: [-122.4194, 37.7749] },
        owner: users[1]._id,
        openingHours: [
          { day: "Monday", open: "11:00", close: "22:00" },
          { day: "Tuesday", open: "11:00", close: "22:00" },
          { day: "Wednesday", open: "11:00", close: "22:00" },
          { day: "Thursday", open: "11:00", close: "23:00" },
          { day: "Friday", open: "11:00", close: "23:00" },
          { day: "Saturday", open: "10:00", close: "23:00" },
          { day: "Sunday", open: "10:00", close: "21:00" },
        ],
      },
      {
        name: "TechHub Co-working",
        category: "Technology",
        description:
          "Premium co-working space with high-speed internet, meeting rooms, and a thriving community of tech professionals and startups.",
        contactPhone: "+1-555-0102",
        contactEmail: "hello@techhub.com",
        website: "https://techhub.example.com",
        address: "456 Innovation Blvd, San Francisco, CA 94103",
        location: { type: "Point", coordinates: [-122.4094, 37.7849] },
        owner: users[2]._id,
        openingHours: [
          { day: "Monday", open: "07:00", close: "22:00" },
          { day: "Tuesday", open: "07:00", close: "22:00" },
          { day: "Wednesday", open: "07:00", close: "22:00" },
          { day: "Thursday", open: "07:00", close: "22:00" },
          { day: "Friday", open: "07:00", close: "22:00" },
          { day: "Saturday", open: "09:00", close: "18:00" },
          { day: "Sunday", closed: true, open: "00:00", close: "00:00" },
        ],
      },
      {
        name: "Zen Fitness Studio",
        category: "Fitness",
        description:
          "A holistic fitness studio offering yoga, pilates, HIIT, and meditation classes. Personal training and nutrition counseling available.",
        contactPhone: "+1-555-0103",
        contactEmail: "info@zenfitness.com",
        website: "https://zenfitness.example.com",
        address: "789 Wellness Way, San Francisco, CA 94104",
        location: { type: "Point", coordinates: [-122.3994, 37.7949] },
        owner: users[3]._id,
        openingHours: [
          { day: "Monday", open: "05:30", close: "21:00" },
          { day: "Tuesday", open: "05:30", close: "21:00" },
          { day: "Wednesday", open: "05:30", close: "21:00" },
          { day: "Thursday", open: "05:30", close: "21:00" },
          { day: "Friday", open: "05:30", close: "20:00" },
          { day: "Saturday", open: "07:00", close: "18:00" },
          { day: "Sunday", open: "08:00", close: "16:00" },
        ],
      },
      {
        name: "Green Earth Market",
        category: "Retail",
        description:
          "Organic grocery store and deli featuring local produce, artisan goods, and sustainable household products. Weekly farmers market on Saturdays.",
        contactPhone: "+1-555-0104",
        contactEmail: "shop@greenearth.com",
        website: "https://greenearth.example.com",
        address: "321 Eco Lane, San Francisco, CA 94105",
        location: { type: "Point", coordinates: [-122.3894, 37.7849] },
        owner: users[1]._id,
        openingHours: [
          { day: "Monday", open: "08:00", close: "20:00" },
          { day: "Tuesday", open: "08:00", close: "20:00" },
          { day: "Wednesday", open: "08:00", close: "20:00" },
          { day: "Thursday", open: "08:00", close: "20:00" },
          { day: "Friday", open: "08:00", close: "21:00" },
          { day: "Saturday", open: "07:00", close: "21:00" },
          { day: "Sunday", open: "09:00", close: "18:00" },
        ],
      },
      {
        name: "Bright Smiles Dental",
        category: "Healthcare",
        description:
          "Family-friendly dental practice offering general dentistry, cosmetic procedures, and orthodontics. State-of-the-art equipment and gentle care.",
        contactPhone: "+1-555-0105",
        contactEmail: "appointments@brightsmiles.com",
        website: "https://brightsmiles.example.com",
        address: "567 Health Ave, San Francisco, CA 94106",
        location: { type: "Point", coordinates: [-122.4294, 37.7649] },
        owner: users[4]._id,
        openingHours: [
          { day: "Monday", open: "08:00", close: "17:00" },
          { day: "Tuesday", open: "08:00", close: "17:00" },
          { day: "Wednesday", open: "08:00", close: "17:00" },
          { day: "Thursday", open: "08:00", close: "17:00" },
          { day: "Friday", open: "08:00", close: "15:00" },
          { day: "Saturday", closed: true, open: "00:00", close: "00:00" },
          { day: "Sunday", closed: true, open: "00:00", close: "00:00" },
        ],
      },
      {
        name: "The Learning Hub",
        category: "Education",
        description:
          "Tutoring center and enrichment programs for students K-12. SAT/ACT prep, coding bootcamps, and language classes available year-round.",
        contactPhone: "+1-555-0106",
        contactEmail: "info@learninghub.com",
        website: "https://learninghub.example.com",
        address: "890 Scholar Street, San Francisco, CA 94107",
        location: { type: "Point", coordinates: [-122.3994, 37.7549] },
        owner: users[2]._id,
        openingHours: [
          { day: "Monday", open: "09:00", close: "20:00" },
          { day: "Tuesday", open: "09:00", close: "20:00" },
          { day: "Wednesday", open: "09:00", close: "20:00" },
          { day: "Thursday", open: "09:00", close: "20:00" },
          { day: "Friday", open: "09:00", close: "18:00" },
          { day: "Saturday", open: "10:00", close: "16:00" },
          { day: "Sunday", closed: true, open: "00:00", close: "00:00" },
        ],
      },
      {
        name: "Glamour Studio",
        category: "Beauty",
        description:
          "Full-service beauty salon and spa offering haircuts, coloring, facials, manicures, and massage therapy in a relaxing atmosphere.",
        contactPhone: "+1-555-0107",
        contactEmail: "book@glamourstudio.com",
        website: "https://glamourstudio.example.com",
        address: "234 Style Blvd, San Francisco, CA 94108",
        location: { type: "Point", coordinates: [-122.4094, 37.7949] },
        owner: users[3]._id,
        openingHours: [
          { day: "Monday", closed: true, open: "00:00", close: "00:00" },
          { day: "Tuesday", open: "10:00", close: "19:00" },
          { day: "Wednesday", open: "10:00", close: "19:00" },
          { day: "Thursday", open: "10:00", close: "20:00" },
          { day: "Friday", open: "10:00", close: "20:00" },
          { day: "Saturday", open: "09:00", close: "18:00" },
          { day: "Sunday", open: "10:00", close: "16:00" },
        ],
      },
      {
        name: "AutoCare Pro",
        category: "Automotive",
        description:
          "Full-service auto repair and maintenance center. Oil changes, brake service, tire rotation, engine diagnostics, and more.",
        contactPhone: "+1-555-0108",
        contactEmail: "service@autocarepro.com",
        website: "https://autocarepro.example.com",
        address: "678 Motor Drive, San Francisco, CA 94109",
        location: { type: "Point", coordinates: [-122.4194, 37.8049] },
        owner: users[4]._id,
        openingHours: [
          { day: "Monday", open: "07:30", close: "18:00" },
          { day: "Tuesday", open: "07:30", close: "18:00" },
          { day: "Wednesday", open: "07:30", close: "18:00" },
          { day: "Thursday", open: "07:30", close: "18:00" },
          { day: "Friday", open: "07:30", close: "18:00" },
          { day: "Saturday", open: "08:00", close: "14:00" },
          { day: "Sunday", closed: true, open: "00:00", close: "00:00" },
        ],
      },
    ]);

    console.log("Creating reviews...");
    const reviews = [];
    const reviewData = [
      {
        business: businesses[0]._id,
        user: users[2]._id,
        rating: 5,
        comment:
          "Amazing food and atmosphere! The seasonal menu is always a delight.",
      },
      {
        business: businesses[0]._id,
        user: users[3]._id,
        rating: 4,
        comment:
          "Great food, slightly pricey but worth it for special occasions.",
      },
      {
        business: businesses[1]._id,
        user: users[1]._id,
        rating: 5,
        comment:
          "Best co-working space in the city. Fast WiFi and great community.",
      },
      {
        business: businesses[1]._id,
        user: users[3]._id,
        rating: 4,
        comment: "Love the meeting rooms and coffee bar. Could use more quiet spaces.",
      },
      {
        business: businesses[2]._id,
        user: users[1]._id,
        rating: 5,
        comment: "Incredible yoga classes! The instructors are top-notch.",
      },
      {
        business: businesses[2]._id,
        user: users[4]._id,
        rating: 4,
        comment: "Great variety of classes. Morning sessions are especially good.",
      },
      {
        business: businesses[3]._id,
        user: users[2]._id,
        rating: 4,
        comment: "Love the organic selection. Fresh produce is always top quality.",
      },
      {
        business: businesses[4]._id,
        user: users[1]._id,
        rating: 5,
        comment: "Dr. Chen is fantastic! Painless experience and very professional.",
      },
      {
        business: businesses[5]._id,
        user: users[4]._id,
        rating: 5,
        comment:
          "My kids love the tutoring sessions. Their grades improved significantly!",
      },
      {
        business: businesses[6]._id,
        user: users[1]._id,
        rating: 4,
        comment: "Great haircut and the spa treatments are very relaxing.",
      },
    ];

    for (const rd of reviewData) {
      reviews.push(await Review.create(rd));
    }

    for (const biz of businesses) {
      const bizReviews = reviews.filter(
        (r) => r.business.toString() === biz._id.toString()
      );
      if (bizReviews.length > 0) {
        const avgRating =
          bizReviews.reduce((sum, r) => sum + r.rating, 0) / bizReviews.length;
        await Business.findByIdAndUpdate(biz._id, {
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: bizReviews.length,
        });
      }
    }

    console.log("Creating favorites...");
    await Favorite.create([
      { user: users[1]._id, business: businesses[1]._id },
      { user: users[1]._id, business: businesses[2]._id },
      { user: users[2]._id, business: businesses[0]._id },
      { user: users[3]._id, business: businesses[0]._id },
      { user: users[3]._id, business: businesses[3]._id },
    ]);

    console.log("\nSeed completed successfully!");
    console.log(`  Users: ${users.length}`);
    console.log(`  Businesses: ${businesses.length}`);
    console.log(`  Reviews: ${reviews.length}`);
    console.log(`  Favorites: 5`);
    console.log("\nTest Accounts:");
    console.log("  Admin:  admin@nearhub.com / password123");
    console.log("  User:   jane@example.com / password123");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
