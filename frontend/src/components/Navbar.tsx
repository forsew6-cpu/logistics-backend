"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NH</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NearHub</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link
                href="/"
                className="text-gray-600 hover:text-primary-600 px-1 py-2 text-sm font-medium transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/businesses"
                className="text-gray-600 hover:text-primary-600 px-1 py-2 text-sm font-medium transition-colors"
              >
                Businesses
              </Link>
              {user && (
                <Link
                  href="/favorites"
                  className="text-gray-600 hover:text-primary-600 px-1 py-2 text-sm font-medium transition-colors"
                >
                  Favorites
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-primary-600 px-1 py-2 text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/businesses/create"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  + Add Business
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/"
              className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="/businesses"
              className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Businesses
            </Link>
            {user ? (
              <>
                <Link
                  href="/favorites"
                  className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Favorites
                </Link>
                <Link
                  href="/businesses/create"
                  className="block text-primary-600 py-2 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  + Add Business
                </Link>
                <Link
                  href="/profile"
                  className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="block text-gray-500 py-2 text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-gray-600 hover:text-primary-600 py-2 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block text-primary-600 py-2 text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
