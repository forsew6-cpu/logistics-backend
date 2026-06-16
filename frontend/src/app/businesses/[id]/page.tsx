"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Map from "@/components/Map";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Business, Review } from "@/types";

export default function BusinessDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBusiness = useCallback(async () => {
    try {
      const id = params.id as string;
      const [bizData, reviewData] = await Promise.all([
        api.getBusiness(id) as Promise<{ business: Business }>,
        api.getReviews(id) as Promise<{ reviews: Review[] }>,
      ]);
      setBusiness(bizData.business);
      setReviews(reviewData.reviews);

      if (user) {
        try {
          const favData = (await api.checkFavorite(id)) as {
            isFavorite: boolean;
          };
          setIsFavorite(favData.isFavorite);
        } catch {
          // not logged in or error
        }
      }
    } catch (err) {
      console.error("Failed to load business:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  const toggleFavorite = async () => {
    if (!business) return;
    try {
      if (isFavorite) {
        await api.removeFavorite(business._id);
      } else {
        await api.addFavorite(business._id);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleReviewAdded = (review: Review) => {
    setReviews([review, ...reviews]);
    if (business) {
      const newTotal = business.totalReviews + 1;
      const newAvg =
        (business.averageRating * business.totalReviews + review.rating) /
        newTotal;
      setBusiness({
        ...business,
        totalReviews: newTotal,
        averageRating: Math.round(newAvg * 10) / 10,
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Business not found</p>
          <Link href="/businesses" className="text-primary-600 font-medium">
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/businesses"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Businesses
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {business.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {business.category}
              </span>
              <div className="flex items-center gap-1">
                <StarRating
                  rating={business.averageRating}
                  size="sm"
                  showValue
                />
                <span className="text-sm text-gray-500">
                  ({business.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>
          {user && (
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${isFavorite ? "text-red-500 bg-red-50" : "text-gray-400 bg-gray-50 hover:text-red-500"}`}
            >
              <svg
                className="w-6 h-6"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images */}
          {business.images && business.images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {business.images.map((img, i) => (
                <img
                  key={i}
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}${img}`}
                  alt={`${business.name} ${i + 1}`}
                  className="w-full h-48 object-cover rounded-xl"
                />
              ))}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {business.description}
            </p>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Location</h2>
            <Map
              businesses={[business]}
              center={business.location.coordinates}
              zoom={15}
              className="w-full h-[300px]"
              showUserLocation={false}
            />
            <p className="text-sm text-gray-500 mt-3">{business.address}</p>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">
              Reviews ({reviews.length})
            </h2>

            {user && (
              <div className="mb-6">
                <ReviewForm
                  businessId={business._id}
                  onReviewAdded={handleReviewAdded}
                />
              </div>
            )}

            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">
                          {review.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {review.user.name}
                        </p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {user &&
                        (user.id === review.user._id ||
                          user._id === review.user._id) && (
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {review.comment}
                  </p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No reviews yet. Be the first to review!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              {business.contactPhone && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-600">
                    {business.contactPhone}
                  </span>
                </div>
              )}
              {business.contactEmail && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-600">
                    {business.contactEmail}
                  </span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Website
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-gray-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-600">{business.address}</span>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          {business.openingHours && business.openingHours.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Opening Hours
              </h2>
              <div className="space-y-2 text-sm">
                {business.openingHours.map((hours) => (
                  <div
                    key={hours.day}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600 font-medium">
                      {hours.day}
                    </span>
                    <span className="text-gray-500">
                      {hours.closed
                        ? "Closed"
                        : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Listed by</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {business.owner.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {business.owner.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
