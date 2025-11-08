"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { API_BASE_URL } from "@/utils/const";
import { useUser, UserProfile } from "@/hooks/useUser";

export default function AccountInfo() {
  const { updateUserFromProfile, getToken } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsFetching(true);

        const token = getToken();
        if (!token) {
          toast.error("Bạn cần đăng nhập để xem thông tin");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users/self`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Không thể tải thông tin người dùng",
          }));
          throw new Error(errorData.message || "Không thể tải thông tin người dùng");
        }

        const data: UserProfile = await response.json();
        setUserProfile(data);
        
        // Set form data from fetched profile
        setFormData({
          username: data.username || "",
          phone: data.phone || "",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải thông tin người dùng";
        toast.error(errorMessage);
        console.error("Error fetching user profile:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

      const token = getToken();
      if (!token) {
        toast.error("Bạn cần đăng nhập để cập nhật thông tin");
        return;
      }

      // Prepare update data (only include fields that have changed)
      const updateData: { username?: string; phone?: string } = {};
      
      if (formData.username !== userProfile?.username) {
        updateData.username = formData.username;
      }
      if (formData.phone !== (userProfile?.phone || "")) {
        updateData.phone = formData.phone;
      }

      // Check if there's any data to update
      if (Object.keys(updateData).length === 0) {
        toast.info("Không có thay đổi nào để lưu");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/self`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Không thể cập nhật thông tin");
      }

      toast.success("Cập nhật thông tin thành công!");
      
      // Update userProfile with new data
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          ...updateData,
        };
        setUserProfile(updatedProfile);
        
        // Update user data in localStorage using the hook
        updateUserFromProfile(updatedProfile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật thông tin";
      toast.error(errorMessage);
      console.error("Error updating user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl mb-6">
        Thông tin tài khoản
      </h1>

      {/* Loading State */}
      {isFetching && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      )}

      {/* Avatar Section */}
      {!isFetching && userProfile && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <Image
                  src="/img.png"
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <button type="button" className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                <Camera className="w-3 h-3 text-gray-600" />
              </button>
            </div>
            <div>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                Đổi avatar
              </Button>
              <p className="text-sm text-gray-500 mt-1">
                Chọn ảnh có kích thước tối đa 5MB
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <Input
                    id="fullname"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email || ""}
                      disabled
                      className="w-full pr-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email không thể thay đổi
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
