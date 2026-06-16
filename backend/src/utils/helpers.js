const CATEGORIES = [
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
];

const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return { skip: (p - 1) * l, limit: l, page: p };
};

module.exports = { CATEGORIES, paginate };
