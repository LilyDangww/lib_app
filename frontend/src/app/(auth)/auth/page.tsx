"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "login";
  const isLogin = tab === "login";

  const handleTabChange = (newTab: string) => {
    router.push(`/auth?tab=${newTab}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 bg-[#5B7C8D] rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Book icon"
            >
              <title>Book icon</title>
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-700">D Free Book</h1>
        </Link>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 text-center pb-3 transition-colors ${
              isLogin
                ? "text-gray-700 font-medium border-b-2 border-gray-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("signup")}
            className={`flex-1 text-center pb-3 transition-colors ${
              !isLogin
                ? "text-gray-700 font-medium border-b-2 border-gray-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Login Form */}
        {isLogin && (
          <LoginForm onSwitchToSignup={() => handleTabChange("signup")} />
        )}

        {/* Signup Form */}
        {!isLogin && (
          <SignupForm onSwitchToLogin={() => handleTabChange("login")} />
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}
