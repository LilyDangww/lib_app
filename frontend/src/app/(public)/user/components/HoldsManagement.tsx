"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import { API_BASE_URL } from "@/utils/const";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HoldStatus = "pending" | "active" | "completed" | "cancelled" | "expired";

interface HoldItem {
  id: string;
  coverImage: string | null;
  title: string;
  author?: string | null;
  recordId: string;
  holdDate: string;
  expirationDate: string;
  status: HoldStatus;
  cancelReason?: string | null;
}

const statusTabs = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "active", label: "Đang giữ" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Hủy" },
];

const toDisplayStatus = (s?: string | null): HoldStatus => {
  switch ((s || "").toLowerCase()) {
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

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const normalize = (raw: any): HoldItem => ({
  id: String(raw?.detail_id ?? raw?.id ?? Math.random()),
  coverImage: raw.image_url ?? null,
  title: raw.book_title ?? "Không rõ tên",
  author: raw.book_author ?? null,
  recordId: raw.barcode ?? "—",
  holdDate: formatDate(raw.hold_start_at ?? raw.request_date),
  expirationDate: formatDate(raw.default_expire_at),
  status: toDisplayStatus(raw.detail_status),
  cancelReason: raw.cancel_reason ?? null,
});

const getStatusLabel = (s: HoldStatus) => {
  switch (s) {
    case "pending":
      return "Chờ xác nhận";
    case "active":
      return "Đang giữ";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Hủy";
    default:
      return s;
  }
};

export default function HoldsManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [holds, setHolds] = useState<HoldItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/reservations/my/holds`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await res.json().catch(() => []);
        setHolds(Array.isArray(data) ? data.map(normalize) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return activeTab === "all"
      ? holds
      : holds.filter((h) => h.status === activeTab);
  }, [holds, activeTab]);

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const canCancel = (s: HoldStatus) => s === "pending" || s === "active";

  const handleCancel = async (detailId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Bạn có chắc muốn hủy bản giữ này?")) return;

    const reason = prompt("Nhập lý do hủy (không bắt buộc):") || null;

    try {
      setCancelingId(detailId);

      const res = await fetch(
        `${API_BASE_URL}/reservations/detail/${detailId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Hủy thất bại!");
        return;
      }

      setHolds((prev) =>
        prev.map((h) =>
          h.id === detailId
            ? { ...h, status: "cancelled", cancelReason: reason }
            : h
        )
      );
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl mb-6">Quản lý đơn giữ</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setCurrentPage(1);
              }}
              className={`py-2 border-b-2 text-sm ${
                activeTab === t.id
                  ? "border-teal-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Ảnh bìa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Tên sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Mã bản ghi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Ngày đặt giữ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Ngày hết hạn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              paginated.map((h) => (
                <tr key={h.id}>
                  <td className="px-6 py-4">
                    <div className="w-12 h-16 relative">
                      <Image
                        src={h.coverImage || "/img.png"}
                        alt={h.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium">{h.title}</div>
                    <div className="text-sm text-gray-500">
                      {h.author || "—"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm">{h.recordId}</td>
                  <td className="px-6 py-4 text-sm">{h.holdDate}</td>
                  <td className="px-6 py-4 text-sm">{h.expirationDate}</td>

                  {/* STATUS + ICON ! */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Badge */}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${
                            h.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : h.status === "active"
                              ? "bg-blue-100 text-blue-700"
                              : h.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                      >
                        {getStatusLabel(h.status)}
                      </span>

                      {/* ICON ! WHEN CANCELLED */}
                      {h.status === "cancelled" && h.cancelReason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-pointer text-red-500">
                              <AlertCircle size={18} />
                            </div>
                          </TooltipTrigger>

                          <TooltipContent className="bg-red-100 text-red-800 max-w-xs">
                            <p className="text-sm">Lý do: {h.cancelReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right whitespace-nowrap text-sm">
                    {canCancel(h.status) && (
                      <button
                        onClick={() => handleCancel(h.id)}
                        disabled={cancelingId === h.id}
                        className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-1 rounded-md text-sm disabled:opacity-50"
                      >
                        {cancelingId === h.id ? "Đang hủy..." : "Hủy"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import Pagination from "@/components/Pagination";
// import Image from "next/image";
// import { API_BASE_URL } from "@/utils/const";

// type HoldStatus = "pending" | "active" | "completed" | "cancelled";

// interface HoldItem {
//   id: string; // === reservation_details.id (detail_id)
//   coverImage: string | null;
//   title: string;
//   author?: string | null;
//   recordId: string;
//   holdDate: string;
//   expirationDate: string;
//   status: HoldStatus; // map từ rd.status
// }

// const statusDisplayTabs = [
//   { id: "all", label: "Tất cả" },
//   { id: "pending", label: "Chờ xác nhận" },
//   { id: "active", label: "Đang giữ" }, // on_hold
//   { id: "completed", label: "Hoàn thành" },
//   { id: "cancelled", label: "Hủy" },
// ];

// const mapDetailStatusToDisplay = (detailStatus?: string | null): HoldStatus => {
//   const normalized = (detailStatus || "").toLowerCase();
//   switch (normalized) {
//     case "pending":
//       return "pending";
//     case "on_hold":
//       return "active"; // FE gọi là active
//     case "picked_up":
//       return "completed";
//     case "cancelled":
//     case "expired":
//       return "cancelled";
//     default:
//       return "pending";
//   }
// };

// const formatDateDisplay = (value?: string | null) => {
//   if (!value) {
//     return "—";
//   }
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }
//   return date.toLocaleDateString("vi-VN", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//   });
// };

// const buildHoldItem = (raw: any): HoldItem => {
//   // ✅ bắt buộc ưu tiên detail_id, vì đó là reservation_details.id
//   const detailId = raw.detail_id ?? raw.id;

//   return {
//     id: String(detailId),
//     coverImage: raw.image_url ?? null,
//     title: raw.book_title ?? "Không rõ tên sách",
//     author: raw.book_author ?? null,
//     recordId: raw.barcode ?? "—",
//     holdDate: formatDateDisplay(raw.hold_start_at ?? raw.request_date),
//     expirationDate: formatDateDisplay(raw.default_expire_at),
//     status: mapDetailStatusToDisplay(raw.detail_status),
//   };
// };

// export default function HoldsManagement() {
//   const [activeTab, setActiveTab] = useState("pending");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [holds, setHolds] = useState<HoldItem[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     const controller = new AbortController();

//     const fetchHolds = async () => {
//       const token =
//         typeof window !== "undefined" ? localStorage.getItem("token") : null;

//       if (!token) {
//         setError("Bạn cần đăng nhập để xem đơn giữ.");
//         setHolds([]);
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const response = await fetch(`${API_BASE_URL}/reservations/my/holds`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           signal: controller.signal,
//         });

//         if (!response.ok) {
//           const payload = await response.json().catch(() => ({}));
//           throw new Error(
//             payload?.message || "Không thể tải danh sách giữ sách."
//           );
//         }

//         const data = await response.json().catch(() => []);
//         const normalized = Array.isArray(data)
//           ? data.map((item) => buildHoldItem(item))
//           : [];

//         setHolds(normalized);
//       } catch (err) {
//         if ((err as Error).name === "AbortError") {
//           return;
//         }
//         const message =
//           err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.";
//         setError(message);
//         setHolds([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchHolds();

//     return () => {
//       controller.abort();
//     };
//   }, []);

//   const filteredHolds = useMemo(() => {
//     if (activeTab === "all") {
//       return holds;
//     }
//     return holds.filter((hold) => hold.status === activeTab);
//   }, [holds, activeTab]);

//   // Paginate results
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedHolds = filteredHolds.slice(startIndex, endIndex);
//   const totalPages = Math.ceil(filteredHolds.length / itemsPerPage);

//   const getStatusBadge = (status: string) => {
//     const statusConfig = {
//       pending: {
//         label: "Chờ xác nhận",
//         className: "bg-yellow-100 text-yellow-800",
//       },
//       active: { label: "Đang giữ", className: "bg-blue-100 text-blue-800" },
//       completed: {
//         label: "Hoàn thành",
//         className: "bg-green-100 text-green-800",
//       },
//       cancelled: { label: "Hủy", className: "bg-red-100 text-red-800" },
//     };

//     const config =
//       statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

//     return (
//       <span
//         className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
//       >
//         {config.label}
//       </span>
//     );
//   };

//   // Chỉ cho hủy khi status = pending (reservation_details.pending)
//   // hoặc active (reservation_details.on_hold)
//   const canCancel = (status: HoldStatus) =>
//     status === "pending" || status === "active";

//   const handleCancelHold = async (detailId: string) => {
//     const hold = holds.find((h) => h.id === detailId);
//     if (!hold || !canCancel(hold.status)) return;

//     if (!confirm("Bạn có chắc muốn hủy bản giữ này không?")) return;

//     const reason = prompt("Vui lòng nhập lý do hủy (không bắt buộc):") || null;

//     try {
//       setIsCancellingId(detailId);

//       const token =
//         typeof window !== "undefined" ? localStorage.getItem("token") : null;

//       if (!token) {
//         alert("Bạn chưa đăng nhập");
//         return;
//       }

//       const res = await fetch(
//         `${API_BASE_URL}/reservations/details/${detailId}/cancel`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ reason }),
//         }
//       );

//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         alert(data.message || "Hủy giữ thất bại");
//         return;
//       }

//       // 🎉 Cập nhật UI ngay lập tức
//       setHolds((prev) =>
//         prev.map((h) =>
//           h.id === detailId
//             ? { ...h, status: "cancelled", cancel_reason: reason }
//             : h
//         )
//       );

//       alert("Đã hủy bản giữ thành công!");
//     } catch (err) {
//       console.error("❌ Cancel hold error:", err);
//       alert("Không thể kết nối tới server");
//     } finally {
//       setIsCancellingId(null);
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6">
//       {/* Header */}
//       <h1 className="text-2xl mb-6">Quản lý đơn giữ</h1>

//       {/* Tabs */}
//       <div className="border-b border-gray-200 mb-6">
//         <nav className="flex space-x-8">
//           {statusDisplayTabs.map((tab) => (
//             <button
//               key={tab.id}
//               type="button"
//               onClick={() => {
//                 setActiveTab(tab.id);
//                 setCurrentPage(1);
//               }}
//               className={`min-w-[110px] text-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
//                 activeTab === tab.id
//                   ? "border-teal-500 text-gray-900"
//                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto">
//         {error && (
//           <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Ảnh bìa
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Tên sách
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Mã bản ghi
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Ngày đặt giữ
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Ngày hết hạn
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Trạng thái
//               </th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Hành động
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {isLoading ? (
//               <tr>
//                 <td
//                   colSpan={7}
//                   className="px-6 py-8 text-center text-sm text-gray-500"
//                 >
//                   Đang tải danh sách giữ sách...
//                 </td>
//               </tr>
//             ) : paginatedHolds.length > 0 ? (
//               paginatedHolds.map((hold) => (
//                 <tr key={hold.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="w-12 h-16 relative">
//                       <Image
//                         src={hold.coverImage || "/img.png"}
//                         alt={hold.title}
//                         fill
//                         className="object-cover rounded"
//                       />
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div>
//                       <div className="text-sm font-medium text-gray-900">
//                         {hold.title}
//                       </div>
//                       <div className="text-sm text-gray-500">
//                         {hold.author || "—"}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {hold.recordId}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {hold.holdDate}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     {hold.expirationDate}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {getStatusBadge(hold.status)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
//                     {canCancel(hold.status) && (
//                       <button
//                         type="button"
//                         onClick={() => handleCancelHold(hold.id)}
//                         disabled={isCancellingId === hold.id}
//                         className="inline-flex items-center px-3 py-1.5 border border-red-500 text-xs font-medium rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isCancellingId === hold.id ? "Đang hủy..." : "Hủy"}
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))
//             ) : null}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="mt-6 flex justify-center">
//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             onPageChange={setCurrentPage}
//           />
//         </div>
//       )}

//       {/* Empty state */}
//       {!isLoading && filteredHolds.length === 0 && (
//         <div className="text-center py-12">
//           <div className="text-gray-500 text-lg mb-2">Không có đơn giữ nào</div>
//           <div className="text-gray-400 text-sm">
//             Bạn chưa có đơn giữ nào trong danh mục này
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
