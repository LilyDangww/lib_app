"use client";

import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/Pagination";
import Image from "next/image";
import { API_BASE_URL } from "@/utils/const";

type HoldStatus = "pending" | "active" | "completed" | "cancelled";

interface HoldItem {
  id: string;
  coverImage: string | null;
  title: string;
  author?: string | null;
  recordId: string;
  holdType: "soft" | "hard";
  holdDate: string;
  expirationDate: string;
  status: HoldStatus;
}

const statusDisplayTabs = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "active", label: "Đang giữ" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Hủy" }
];

const mapDetailStatusToDisplay = (detailStatus?: string | null): HoldStatus => {
  const normalized = (detailStatus || "").toLowerCase();
  switch (normalized) {
    case "pending":
      return "pending";
    case "on_hold":
      return "active";
    case "picked_up":
      return "completed";
    case "cancelled":
    case "expired":
      return "cancelled";
    default:
      return "pending";
  }
};

const formatDateDisplay = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};


const buildHoldItem = (raw: any): HoldItem => {
  const fallbackId = raw?.detail_id ?? raw?.id ?? Math.random().toString(36).slice(2);
  return {
    id: String(fallbackId),
    coverImage: raw.image_url ?? null,
    title: raw.book_title ?? "Không rõ tên sách",
    author: raw.book_author ?? null,
    recordId: raw.barcode ?? "—",
    holdType: (raw.hold_type === "soft" ? "soft" : "hard") as "soft" | "hard",
    holdDate: formatDateDisplay(raw.hold_start_at ?? raw.request_date),
    expirationDate: formatDateDisplay(raw.default_expire_at),
    status: mapDetailStatusToDisplay(raw.detail_status)
  };
};

export default function HoldsManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [holds, setHolds] = useState<HoldItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();

    const fetchHolds = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        setError("Bạn cần đăng nhập để xem đơn giữ.");
        setHolds([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/reservations/my/holds`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || "Không thể tải danh sách giữ sách.");
        }

        const data = await response.json().catch(() => []);
        const normalized = Array.isArray(data)
          ? data.map((item) => buildHoldItem(item))
          : [];

        setHolds(normalized);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.";
        setError(message);
        setHolds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolds();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredHolds = useMemo(() => {
    if (activeTab === "all") {
      return holds;
    }
    return holds.filter((hold) => hold.status === activeTab);
  }, [holds, activeTab]);

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
          {statusDisplayTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
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
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  Đang tải danh sách giữ sách...
                </td>
              </tr>
            ) : paginatedHolds.length > 0 ? (
              paginatedHolds.map((hold) => (
                <tr key={hold.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-16 relative">
                      <Image
                        src={hold.coverImage || "/img.png"}
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
                        {hold.author || "—"}
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
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            )}
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
      {!isLoading && filteredHolds.length === 0 && (
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
