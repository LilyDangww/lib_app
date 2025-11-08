"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pagination } from "@/components";
import { API_BASE_URL } from "@/utils/const";

type BorrowStatusType = "current" | "overdue" | "returned" | "unknown";

interface RentedBookItem {
  id: string;
  coverImage: string | null;
  title: string;
  author?: string | null;
  borrowDate: string;
  dueDate: string;
  statusLabel: string;
  statusType: BorrowStatusType;
  overdueDays: number | null;
  action: string | null;
}

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

const calculateOverdueDays = (dueDate?: string | null) => {
  if (!dueDate) {
    return null;
  }

  const due = new Date(dueDate);
  const today = new Date();

  if (Number.isNaN(due.getTime())) {
    return null;
  }

  // Reset time for accurate day diff
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
};

const mapBorrowStatus = (
  status?: string,
  dueDate?: string | null,
  returnDate?: string | null
): { label: string; type: BorrowStatusType; action: string | null } => {
  const normalized = (status || "").toLowerCase();

  switch (normalized) {
    case "on_loan":
      return {
        label: "Đang mượn",
        type: calculateOverdueDays(dueDate) ? "overdue" : "current",
        action: null
      };
    case "expired":
      return { label: "Quá hạn", type: "overdue", action: null };
    case "returned":
      return {
        label: "Đã trả",
        type: "returned",
        action: returnDate ? `Trả ngày ${formatDateDisplay(returnDate)}` : "Đã hoàn thành"
      };
    case "lost":
      return { label: "Mất", type: "overdue", action: "Liên hệ thư viện" };
    default:
      return { label: "Không xác định", type: "unknown", action: null };
  }
};

const buildRentedBookItem = (raw: any): RentedBookItem => {
  const { label, type, action } = mapBorrowStatus(raw?.status, raw?.due_date, raw?.return_date);
  const overdueDays = type === "overdue" ? calculateOverdueDays(raw?.due_date) : null;

  return {
    id: String(raw?.borrow_detail_id ?? raw?.borrow_id ?? Math.random().toString(36).slice(2)),
    coverImage: raw?.document_image_url ?? null,
    title: raw?.document_name ?? "Không rõ tên sách",
    author: raw?.document_author ?? null,
    borrowDate: formatDateDisplay(raw?.borrow_date),
    dueDate: formatDateDisplay(raw?.due_date),
    statusLabel: label,
    statusType: type,
    overdueDays,
    action
  };
};

export default function RentedBooks() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rentedBooks, setRentedBooks] = useState<RentedBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();

    const fetchRentedBooks = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        setError("Bạn cần đăng nhập để xem sách đã mượn.");
        setRentedBooks([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/borrows/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || "Không thể tải danh sách sách đã mượn.");
        }

        const data = await response.json().catch(() => []);
        const normalized = Array.isArray(data)
          ? data.map((item) => buildRentedBookItem(item))
          : [];

        setRentedBooks(normalized);
        setCurrentPage(1);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.";
        setError(message);
        setRentedBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentedBooks();

    return () => {
      controller.abort();
    };
  }, []);

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return rentedBooks.slice(startIndex, endIndex);
  }, [rentedBooks, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(rentedBooks.length / itemsPerPage));
  }, [rentedBooks.length]);

  const getStatusBadge = (_status: string, statusType: BorrowStatusType) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium text-nowrap";

    switch (statusType) {
      case "current":
        return `${baseClasses} bg-green-100 text-green-700`;
      case "overdue":
        return `${baseClasses} bg-red-100 text-red-700`;
      case "returned":
        return `${baseClasses} bg-gray-100 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl mb-6">
        Sách đã mượn
      </h1>

      <div className="overflow-x-auto">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ảnh bìa</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tên sách</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tác giả</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày mượn</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hạn trả</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Số ngày quá</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-gray-500">
                  Đang tải danh sách sách đã mượn...
                </td>
              </tr>
            ) : paginatedBooks.length > 0 ? (
              paginatedBooks.map((book) => (
                <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-12 h-16 bg-gray-200 rounded-md overflow-hidden relative">
                      <Image
                        src={book.coverImage || "/img.png"}
                        alt={book.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {book.title}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {book.author || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {book.borrowDate}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {book.dueDate}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(book.statusLabel, book.statusType)}>
                      {book.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {book.overdueDays !== null ? book.overdueDays : "-"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {book.action || "—"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-gray-500">
                  Không có sách đã mượn nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rentedBooks.length > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showEllipsis
            maxVisiblePages={3}
          />
        </div>
      )}
    </div>
  );
}
