"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera } from "lucide-react";
import Image from "next/image";

export default function AccountInfo() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Account info form submitted");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl mb-6">
        Thông tin tài khoản
      </h1>

      {/* Avatar Section */}
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
                defaultValue="Nguyễn Thị Mai"
                className="w-full"
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
                  defaultValue="mai.nguyen@email.com"
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
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <Select defaultValue="female">
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <Input
                id="phone"
                type="tel"
                defaultValue="0987654321"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
            Lưu thay đổi
          </Button>
          {/* <Button type="button" variant="outline" className="flex items-center gap-2">
            Thoát
            <Circle className="w-4 h-4" />
          </Button> */}
        </div>
      </form>
    </div>
  );
}
