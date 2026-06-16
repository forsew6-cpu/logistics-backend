"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { User, Business, AdminStats, Pagination } from "@/types";

type Tab = "stats" | "users" | "businesses";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [bizPagination, setBizPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = (await api.getAdminStats()) as { stats: AdminStats };
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      const data = (await api.getAdminUsers(`page=${page}`)) as {
        users: User[];
        pagination: Pagination;
      };
      setUsers(data.users);
      setUserPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  const loadBusinesses = useCallback(async (page = 1) => {
    try {
      const data = (await api.getAdminBusinesses(`page=${page}`)) as {
        businesses: Business[];
        pagination: Pagination;
      };
      setBusinesses(data.businesses);
      setBizPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load businesses:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      Promise.all([loadStats(), loadUsers(), loadBusinesses()]).finally(() =>
        setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, [user, loadStats, loadUsers, loadBusinesses]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await api.updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(userId);
      loadUsers();
      loadStats();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleToggleBusiness = async (businessId: string) => {
    try {
      await api.toggleBusinessActive(businessId);
      loadBusinesses();
    } catch (err) {
      console.error("Failed to toggle business:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {(["stats", "users", "businesses"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {tab === "stats" && stats && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500">Total Businesses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalBusinesses}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalReviews}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Category Breakdown
            </h2>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{cat._id}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${(cat.count / stats.totalBusinesses) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {cat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Role
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Joined
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleToggleRole(u._id || u.id, u.role)
                        }
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Toggle Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id || u.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userPagination && userPagination.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              {Array.from(
                { length: userPagination.pages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => loadUsers(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === userPagination.page
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Businesses Tab */}
      {tab === "businesses" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Owner
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz._id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {biz.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {biz.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {biz.owner?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          biz.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {biz.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleBusiness(biz._id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {biz.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bizPagination && bizPagination.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              {Array.from(
                { length: bizPagination.pages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => loadBusinesses(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === bizPagination.page
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
