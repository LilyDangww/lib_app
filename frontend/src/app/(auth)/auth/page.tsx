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
    <div className="min-h-screen flex items-center justify-center bg-[#F2F6FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* LOGO DFB */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 hover:opacity-90 transition"
        >
          <img
            src="https://dfb.vn/_next/static/media/logo-main.8f4dc5e6.png"
            alt="DFB Logo"
            className="h-14 w-auto"
          />
        </Link>

        {/* Tab chọn Login / Signup */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 text-center pb-3 transition-colors ${
              isLogin
                ? "text-[#4F777A] font-semibold border-b-2 border-[#4F777A]"
                : "text-gray-500 hover:text-[#4F777A]"
            }`}
          >
            Đăng nhập
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("signup")}
            className={`flex-1 text-center pb-3 transition-colors ${
              !isLogin
                ? "text-[#4F777A] font-semibold border-b-2 border-[#4F777A]"
                : "text-gray-500 hover:text-[#4F777A]"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {isLogin ? (
          <LoginForm onSwitchToSignup={() => handleTabChange("signup")} />
        ) : (
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
