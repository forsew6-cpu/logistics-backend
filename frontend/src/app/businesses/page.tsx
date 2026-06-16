"use client";

import { useState, useEffect, useCallback } from "react";
import BusinessCard from "@/components/BusinessCard";
import SearchBar from "@/components/SearchBar";
import { api } from "@/lib/api";
import type { Business, Pagination } from "@/types";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentCategory, setCurrentCategory] = useState("All");

  const loadBusinesses = useCallback(
    async (search?: string, category?: string, page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        const q = search ?? currentSearch;
        const c = category ?? currentCategory;
        if (q) params.set("search", q);
        if (c && c !== "All") params.set("category", c);
        params.set("page", String(page));
        params.set("limit", "20");

        if (search !== undefined) setCurrentSearch(search);
        if (category !== undefined) setCurrentCategory(category);

        const data = (await api.getBusinesses(params.toString())) as {
          businesses: Business[];
          pagination: Pagination;
        };
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Failed to load businesses:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentSearch, currentCategory]
  );

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Browse Businesses
        </h1>
        <p className="text-gray-500">
          Find and explore businesses in your area
        </p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={loadBusinesses} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {pagination?.total || 0} businesses found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businesses.map((biz) => (
              <BusinessCard key={biz._id} business={biz} />
            ))}
          </div>

          {businesses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No businesses match your search.</p>
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() =>
                      loadBusinesses(currentSearch, currentCategory, p)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === pagination.page
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
