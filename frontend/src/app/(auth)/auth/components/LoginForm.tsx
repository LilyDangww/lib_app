"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Mail, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/const";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const requestBody = {
        email: data.email,
        password: data.password,
      };

      console.log("🔵 Login API Request:", {
        url: `${API_BASE_URL}/auth/login`,
        method: "POST",
        body: requestBody,
      });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("🟢 Login API Response Status:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const result = await response.json();

      console.log("🟢 Login API Response Data:", result);

      if (!response.ok) {
        console.error("❌ Login API Error Response:", result);
        throw new Error(result.message || "Đăng nhập thất bại");
      }

      // Store token and user info
      if (result.token) {
        console.log("✅ Login Success - Storing token and user info");
        console.log("📦 Token:", result.token);
        console.log("👤 User Info:", result.user);

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        // Dispatch event to notify Header and other components
        window.dispatchEvent(new Event("auth-state-changed"));
      }

      // Redirect to home page or dashboard
      router.push("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(errorMessage);
      console.error("❌ Login Error:", {
        message: errorMessage,
        error: err,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
      className="space-y-5"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <Input
          {...loginForm.register("email")}
          type="email"
          placeholder="nguyenvana@gmail.com"
          startIcon={<Mail className="w-5 h-5 text-gray-400" />}
          className={loginForm.formState.errors.email ? "border-red-500" : ""}
          disabled={isLoading}
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
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
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
        disabled={isLoading}
        className="
          w-full 
          bg-[#4F777A] 
          hover:bg-[#44696C]
          text-white 
          font-medium 
          py-3 px-4 
          rounded-md 
          transition-colors 
          duration-200
          disabled:bg-gray-300 disabled:cursor-not-allowed
        "
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      {/* Signup Link */}
      <div className="text-center text-sm">
        <span className="text-gray-600">Bạn chưa có tài khoản? </span>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-[#4F777A] hover:underline font-medium"
          disabled={isLoading}
        >
          Đăng ký
        </button>
      </div>
    </form>
  );
}
