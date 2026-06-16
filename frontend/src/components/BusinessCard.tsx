import Link from "next/link";
import StarRating from "./StarRating";
import type { Business } from "@/types";

const categoryColors: Record<string, string> = {
  Restaurant: "bg-orange-100 text-orange-700",
  Retail: "bg-blue-100 text-blue-700",
  Healthcare: "bg-green-100 text-green-700",
  Education: "bg-purple-100 text-purple-700",
  Entertainment: "bg-pink-100 text-pink-700",
  Services: "bg-gray-100 text-gray-700",
  Technology: "bg-indigo-100 text-indigo-700",
  Fitness: "bg-red-100 text-red-700",
  Beauty: "bg-rose-100 text-rose-700",
  Automotive: "bg-amber-100 text-amber-700",
  "Real Estate": "bg-teal-100 text-teal-700",
  Other: "bg-slate-100 text-slate-700",
};

export default function BusinessCard({ business }: { business: Business }) {
  const colorClass = categoryColors[business.category] || categoryColors.Other;

  return (
    <Link href={`/businesses/${business._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group">
        <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
          {business.images && business.images.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}${business.images[0]}`}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="text-center">
              <div className="text-4xl text-primary-300 mb-2">
                {business.name.charAt(0)}
              </div>
              <span className="text-xs text-primary-400">
                {business.category}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {business.name}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass} whitespace-nowrap ml-2`}
            >
              {business.category}
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {business.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <StarRating rating={business.averageRating} size="sm" />
              <span className="text-xs text-gray-500">
                ({business.totalReviews})
              </span>
            </div>
            <span className="text-xs text-gray-400 line-clamp-1 max-w-[120px]">
              {business.address}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
