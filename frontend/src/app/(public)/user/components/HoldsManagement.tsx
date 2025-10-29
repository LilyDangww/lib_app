"use client";

import { useState } from "react";
import Pagination from "@/components/Pagination";
import Image from "next/image";

interface HoldItem {
  id: string;
  coverImage: string;
  title: string;
  author: string;
  recordId: string;
  holdType: "soft" | "hard";
  holdDate: string;
  expirationDate: string;
  status: "pending" | "active" | "completed" | "cancelled";
}

// Sample data
const sampleHolds: HoldItem[] = [
  {
    id: "1",
    coverImage: "/img.png",
    title: "Tắt đèn",
    author: "Ngô Tất Tố",
    recordId: "BK001234",
    holdType: "soft",
    holdDate: "15/10/2024",
    expirationDate: "22/10/2024",
    status: "pending"
  },
  {
    id: "2",
    coverImage: "/img.png",
    title: "Số đỏ",
    author: "Vũ Trọng Phụng",
    recordId: "BK001235",
    holdType: "hard",
    holdDate: "16/10/2024",
    expirationDate: "23/10/2024",
    status: "pending"
  },
  {
    id: "3",
    coverImage: "/img.png",
    title: "Chí Phèo",
    author: "Nam Cao",
    recordId: "BK001236",
    holdType: "soft",
    holdDate: "14/10/2024",
    expirationDate: "21/10/2024",
    status: "active"
  },
  {
    id: "4",
    coverImage: "/img.png",
    title: "Dế mèn phiêu lưu ký",
    author: "Tô Hoài",
    recordId: "BK001237",
    holdType: "hard",
    holdDate: "10/10/2024",
    expirationDate: "17/10/2024",
    status: "completed"
  },
  {
    id: "5",
    coverImage: "/img.png",
    title: "Những ngôi sao xa xôi",
    author: "Lê Minh Khuê",
    recordId: "BK001238",
    holdType: "soft",
    holdDate: "12/10/2024",
    expirationDate: "19/10/2024",
    status: "cancelled"
  }
];

const tabs = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "active", label: "Đang giữ" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Hủy" }
];

export default function HoldsManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter holds based on active tab
  const filteredHolds = activeTab === "all" 
    ? sampleHolds 
    : sampleHolds.filter(hold => hold.status === activeTab);

  // Paginate results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHolds = filteredHolds.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredHolds.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
      active: { label: "Đang giữ", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Hủy", className: "bg-red-100 text-red-800" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getHoldTypeBadge = (type: string) => {
    const typeConfig = {
      soft: { label: "Giữ mềm", className: "bg-blue-100 text-blue-800" },
      hard: { label: "Giữ cứng", className: "bg-purple-100 text-purple-800" }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.soft;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <h1 className="text-2xl mb-6">
        Quản lý đơn giữ
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-teal-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ảnh bìa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã bản ghi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại giữ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đặt giữ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày hết hạn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedHolds.map((hold) => (
              <tr key={hold.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-12 h-16 relative">
                    <Image
                      src={hold.coverImage}
                      alt={hold.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {hold.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {hold.author}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hold.recordId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getHoldTypeBadge(hold.holdType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hold.holdDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {hold.expirationDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(hold.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Empty state */}
      {filteredHolds.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            Không có đơn giữ nào
          </div>
          <div className="text-gray-400 text-sm">
            Bạn chưa có đơn giữ nào trong danh mục này
          </div>
        </div>
      )}
    </div>
  );
}
