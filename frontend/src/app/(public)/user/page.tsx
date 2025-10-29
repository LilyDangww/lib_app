"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    BookOpen,
    Bookmark,
    FileText,
    Key,
    LogOut
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AccountInfo, ChangePassword, RentedBooks, HoldsManagement } from "./components";

export default function UserPage() {
  const [activeTab, setActiveTab] = useState("account-info");

  const sidebarItems = [
    {
      id: "account-info",
      label: "Thông tin tài khoản",
      icon: FileText,
      active: activeTab === "account-info"
    },
    {
      id: "change-password",
      label: "Đổi mật khẩu",
      icon: Key,
      active: activeTab === "change-password"
    },
    {
      id: "borrowed-books",
      label: "Sách đã mượn",
      icon: BookOpen,
      active: activeTab === "borrowed-books"
    },
    {
      id: "holds",
      label: "Đơn giữ",
      icon: Bookmark,
      active: activeTab === "holds"
    }
  ];

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "account-info":
        return "Thông tin tài khoản";
      case "change-password":
        return "Đổi mật khẩu";
      case "borrowed-books":
        return "Sách đã mượn";
      case "holds":
        return "Đơn giữ";
      default:
        return "Thông tin tài khoản";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "account-info":
        return <AccountInfo />;
      case "change-password":
        return <ChangePassword />;
      case "borrowed-books":
        return <RentedBooks />;
      case "holds":
        return <HoldsManagement />;
      default:
        return <AccountInfo />;
    }
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/user">Người dùng</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex gap-6 max-w-[1280px] mx-auto">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between shrink-0 h-[420px]">

          <nav className="space-y-2 mb-8">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button type="button" className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}