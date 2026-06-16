export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: "user" | "admin";
  profilePicture: string;
  bio: string;
  createdAt: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Business {
  _id: string;
  name: string;
  category: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  images: string[];
  openingHours: OpeningHours[];
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  owner: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  _id: string;
  business: string;
  user: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  _id: string;
  user: string;
  business: Business;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  categoryBreakdown: { _id: string; count: number }[];
  recentUsers: User[];
}
