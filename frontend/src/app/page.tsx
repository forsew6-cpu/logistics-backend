"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Map from "@/components/Map";
import BusinessCard from "@/components/BusinessCard";
import SearchBar from "@/components/SearchBar";
import { api } from "@/lib/api";
import type { Business } from "@/types";

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );

  const loadBusinesses = useCallback(
    async (search?: string, category?: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category && category !== "All") params.set("category", category);
        params.set("limit", "50");

        const data = (await api.getBusinesses(params.toString())) as {
          businesses: Business[];
        };
        setBusinesses(data.businesses);
      } catch (err) {
        console.error("Failed to load businesses:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Discover What&apos;s{" "}
              <span className="text-primary-200">Near You</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Find the best businesses, services, events, and opportunities in
              your area with our interactive map.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/businesses"
                className="bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                Browse Businesses
              </Link>
              <Link
                href="/signup"
                className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                List Your Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-6">
            <SearchBar onSearch={loadBusinesses} />
          </div>
          <Map
            businesses={businesses}
            onBusinessClick={setSelectedBusiness}
            className="w-full h-[400px] md:h-[500px]"
          />
          {selectedBusiness && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedBusiness.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedBusiness.category} &middot;{" "}
                    {selectedBusiness.address}
                  </p>
                </div>
                <Link
                  href={`/businesses/${selectedBusiness._id}`}
                  className="text-primary-600 text-sm font-medium hover:text-primary-700"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Businesses
            </h2>
            <p className="text-gray-500 mt-1">
              Discover popular places near you
            </p>
          </div>
          <Link
            href="/businesses"
            className="text-primary-600 font-medium hover:text-primary-700 text-sm"
          >
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businesses.slice(0, 8).map((biz) => (
              <BusinessCard key={biz._id} business={biz} />
            ))}
          </div>
        )}

        {!loading && businesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No businesses found. Be the first to add one!
            </p>
            <Link
              href="/businesses/create"
              className="inline-block mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Add Business
            </Link>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600">
                {businesses.length}+
              </div>
              <div className="text-sm text-gray-500 mt-1">Businesses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">12</div>
              <div className="text-sm text-gray-500 mt-1">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">24/7</div>
              <div className="text-sm text-gray-500 mt-1">Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">Free</div>
              <div className="text-sm text-gray-500 mt-1">To Use</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
