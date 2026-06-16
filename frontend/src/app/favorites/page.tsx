"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Favorite } from "@/types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const data = (await api.getFavorites()) as { favorites: Favorite[] };
      setFavorites(data.favorites);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFavorites();
    else setLoading(false);
  }, [user, loadFavorites]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Please log in to view your favorites.
          </p>
          <Link
            href="/login"
            className="text-primary-600 font-medium hover:text-primary-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Your Favorites
        </h1>
        <p className="text-gray-500">Places you&apos;ve saved for later</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-gray-500 mb-4">No favorites yet.</p>
          <Link
            href="/businesses"
            className="text-primary-600 font-medium hover:text-primary-700"
          >
            Browse Businesses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <BusinessCard key={fav._id} business={fav.business} />
          ))}
        </div>
      )}
    </div>
  );
}
