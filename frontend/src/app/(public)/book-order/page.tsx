"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, List } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Sample data for the book order detail
const orderData = {
  orderId: "DM2024001",
  borrower: "Nguyễn Thị Mai",
  requestDate: "15/03/2024",
  expirationDate: "17/03/2024",
  holdType: "Giữ cứng",
  status: "Đang xác thực",
  statusType: "verifying",
  books: [
    {
      id: 1,
      coverImage: "/img.png",
      title: "Tôi thấy hoa vàng trên cỏ xanh",
      author: "Nguyễn Nhật Ánh",
      recordId: "BG001234",
      status: null,
      statusType: "null"
    },
    {
      id: 2,
      coverImage: "/img (2).png",
      title: "Dế Mèn phiêu lưu ký",
      author: "Tô Hoài",
      recordId: "BG001235",
      status: "Đang giữ",
      statusType: "on-hold"
    }
  ]
};

// Status badge component
function StatusBadge({ status, type }: { status: string | null; type: string }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
        null
      </span>
    );
  }

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "verifying":
      case "on-hold":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case "verifying":
      case "on-hold":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getBadgeStyle(type)}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(type)}`}></span>
      {status}
    </span>
  );
}

export default function BookOrderDetailPage() {
  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
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
            <BreadcrumbLink asChild>
              <Link href="/user?tab=holds">Đơn mượn</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{orderData.orderId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl mb-2">
          Chi tiết Đơn mượn
        </h1>
        <p className="text-gray-600">
          Thông tin chi tiết về phiếu mượn sách
        </p>
      </div>

      {/* User Avatar */}
      <div className="absolute top-8 right-8">
        <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden">
          <Image
            src="/img.png"
            alt="User Avatar"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Order Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg">
                Thông tin đơn mượn
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mã đơn mượn:</span>
                <span className="text-sm font-medium text-gray-900">{orderData.orderId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Người mượn:</span>
                <span className="text-sm font-medium text-gray-900">{orderData.borrower}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ngày yêu cầu:</span>
                <span className="text-sm font-medium text-gray-900">{orderData.requestDate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ngày hết hạn:</span>
                <span className="text-sm font-medium text-gray-900">{orderData.expirationDate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Loại giữ:</span>
                <span className="text-sm font-medium text-gray-900">{orderData.holdType}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trạng thái phiếu:</span>
                <StatusBadge status={orderData.status} type={orderData.statusType} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Borrow Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <List className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg">
                Chi tiết mượn
              </h2>
            </div>
            
            {/* Books Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Ảnh bìa
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Tên sách
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Mã bản ghi
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.books.map((book) => (
                    <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Cover Image */}
                      <td className="py-4 px-4">
                        <div className="w-12 h-16 bg-gray-200 rounded-md overflow-hidden">
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            width={48}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      
                      {/* Book Title */}
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {book.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {book.author}
                          </div>
                        </div>
                      </td>
                      
                      {/* Record ID */}
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {book.recordId}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={book.status} type={book.statusType} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
