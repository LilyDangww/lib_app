"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/const";

const signupSchema = z
  .object({
    username: z.string().min(1, "Vui lòng nhập họ và tên"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(/^\d{9,11}$/, "Số điện thoại phải có 9-11 chữ số"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
    gender: z.enum(["male", "female", "other"]).optional(),
    dob: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      gender: undefined,
      dob: undefined,
    },
  });

  const onSignupSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // Prepare data for API (using registerUser from userController)
      const requestData = {
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        gender: data.gender || null,
        dob: data.dob || null,
      };

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đăng ký thất bại");
      }

      setSuccess(true);
      
      // Reset form
      signupForm.reset();
      
      // Redirect to login after successful signup
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={signupForm.handleSubmit(onSignupSubmit)}
      className="space-y-5"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-600">
            Đăng ký thành công! Đang chuyển đến trang đăng nhập...
          </p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <Input
          {...signupForm.register("username")}
          type="text"
          placeholder="Họ và tên"
          startIcon={<User className="w-5 h-5 text-gray-400" />}
          className={
            signupForm.formState.errors.username ? "border-red-500" : ""
          }
          disabled={isLoading}
        />
        {signupForm.formState.errors.username && (
          <p className="mt-1 text-sm text-red-600">
            {signupForm.formState.errors.username.message}
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
          disabled={isLoading}
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
          placeholder="Số điện thoại (9-11 chữ số)"
          startIcon={<Phone className="w-5 h-5 text-gray-400" />}
          className={
            signupForm.formState.errors.phone ? "border-red-500" : ""
          }
          disabled={isLoading}
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
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
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
        disabled={isLoading || success}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? "Đang đăng ký..." : success ? "Đăng ký thành công!" : "Đăng ký"}
      </button>

      {/* Login Link */}
      <div className="text-center text-sm">
        <span className="text-gray-600">Bạn đã có tài khoản? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline font-medium"
          disabled={isLoading}
        >
          Đăng nhập
        </button>
      </div>
    </form>
  );
}
