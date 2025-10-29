"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const signupSchema = z
  .object({
    fullName: z.string().min(1, "Vui lòng nhập họ và tên"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "login";
  const isLogin = tab === "login";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Reset forms when switching tabs
  useEffect(() => {
    loginForm.reset();
    signupForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [loginForm, signupForm]);

  const onLoginSubmit = (data: LoginFormData) => {
    console.log("Login:", data);
    // Handle login logic here
  };

  const onSignupSubmit = (data: SignupFormData) => {
    console.log("Signup:", data);
    // Handle signup logic here
  };

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
          <form
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <Input
                {...loginForm.register("email")}
                type="email"
                placeholder="nguyenvana@gmail.com"
                startIcon={<Mail className="w-5 h-5 text-gray-400" />}
                className={
                  loginForm.formState.errors.email ? "border-red-500" : ""
                }
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  {...loginForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu (Ít nhất 6 kí tự)"
                  startIcon={
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-label="Lock icon"
                    >
                      <title>Lock icon</title>
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 11V7a5 5 0 0110 0v4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  }
                  className={
                    loginForm.formState.errors.password ? "border-red-500" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              Đăng nhập
            </button>

            {/* Signup Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Bạn chưa có tài khoản? </span>
              <button
                type="button"
                onClick={() => handleTabChange("signup")}
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng ký
              </button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {!isLogin && (
          <form
            onSubmit={signupForm.handleSubmit(onSignupSubmit)}
            className="space-y-5"
          >
            {/* Full Name */}
            <div>
              <Input
                {...signupForm.register("fullName")}
                type="text"
                placeholder="Họ và tên"
                startIcon={<User className="w-5 h-5 text-gray-400" />}
                className={
                  signupForm.formState.errors.fullName ? "border-red-500" : ""
                }
              />
              {signupForm.formState.errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {signupForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Input
                {...signupForm.register("email")}
                type="email"
                placeholder="nguyenvana@gmail.com"
                startIcon={<Mail className="w-5 h-5 text-gray-400" />}
                className={
                  signupForm.formState.errors.email ? "border-red-500" : ""
                }
              />
              {signupForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Input
                {...signupForm.register("phone")}
                type="tel"
                placeholder="Số điện thoại"
                startIcon={<Phone className="w-5 h-5 text-gray-400" />}
                className={
                  signupForm.formState.errors.phone ? "border-red-500" : ""
                }
              />
              {signupForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {signupForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  {...signupForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu (Ít nhất 6 kí tự)"
                  startIcon={
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-label="Lock icon"
                    >
                      <title>Lock icon</title>
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 11V7a5 5 0 0110 0v4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  }
                  className={
                    signupForm.formState.errors.password ? "border-red-500" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Input
                  {...signupForm.register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  startIcon={
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-label="Lock icon"
                    >
                      <title>Lock icon</title>
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 11V7a5 5 0 0110 0v4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  }
                  className={
                    signupForm.formState.errors.confirmPassword
                      ? "border-red-500"
                      : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              Đăng ký
            </button>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Bạn đã có tài khoản? </span>
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng nhập
              </button>
            </div>
          </form>
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
