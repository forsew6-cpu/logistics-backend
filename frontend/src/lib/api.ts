const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nearhub_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export const api = {
  // Auth
  signup: (body: { name: string; email: string; password: string }) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getMe: () => request("/auth/me"),

  // Users
  updateProfile: (body: { name?: string; bio?: string }) =>
    request("/users/profile", { method: "PUT", body: JSON.stringify(body) }),

  uploadProfilePicture: (formData: FormData) =>
    request("/users/profile/picture", { method: "POST", body: formData }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request("/users/change-password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // Businesses
  getBusinesses: (params?: string) =>
    request(`/businesses${params ? `?${params}` : ""}`),

  getNearbyBusinesses: (lng: number, lat: number, distance?: number) =>
    request(
      `/businesses/nearby?lng=${lng}&lat=${lat}${distance ? `&distance=${distance}` : ""}`
    ),

  getBusiness: (id: string) => request(`/businesses/${id}`),

  createBusiness: (formData: FormData) =>
    request("/businesses", { method: "POST", body: formData }),

  updateBusiness: (id: string, formData: FormData) =>
    request(`/businesses/${id}`, { method: "PUT", body: formData }),

  deleteBusiness: (id: string) =>
    request(`/businesses/${id}`, { method: "DELETE" }),

  // Reviews
  getReviews: (businessId: string, page?: number) =>
    request(
      `/reviews/business/${businessId}${page ? `?page=${page}` : ""}`
    ),

  createReview: (
    businessId: string,
    body: { rating: number; comment: string }
  ) =>
    request(`/reviews/business/${businessId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateReview: (id: string, body: { rating?: number; comment?: string }) =>
    request(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteReview: (id: string) =>
    request(`/reviews/${id}`, { method: "DELETE" }),

  // Favorites
  getFavorites: (page?: number) =>
    request(`/favorites${page ? `?page=${page}` : ""}`),

  addFavorite: (businessId: string) =>
    request(`/favorites/${businessId}`, { method: "POST" }),

  removeFavorite: (businessId: string) =>
    request(`/favorites/${businessId}`, { method: "DELETE" }),

  checkFavorite: (businessId: string) =>
    request(`/favorites/check/${businessId}`),

  // Admin
  getAdminStats: () => request("/admin/stats"),

  getAdminUsers: (params?: string) =>
    request(`/admin/users${params ? `?${params}` : ""}`),

  updateUserRole: (id: string, role: string) =>
    request(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request(`/admin/users/${id}`, { method: "DELETE" }),

  getAdminBusinesses: (params?: string) =>
    request(`/admin/businesses${params ? `?${params}` : ""}`),

  toggleBusinessActive: (id: string) =>
    request(`/admin/businesses/${id}/toggle`, { method: "PUT" }),

  deleteAdminReview: (id: string) =>
    request(`/admin/reviews/${id}`, { method: "DELETE" }),
};
