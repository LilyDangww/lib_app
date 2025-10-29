"use client";

import { useState } from "react";
import Image from "next/image";
import { Pagination } from "@/components";

// Sample data for rented books
const sampleRentedBooks = [
  {
    id: 1,
    coverImage: "/img.png",
    title: "Tôi thấy hoa vàng trên cỏ xanh",
    author: "Nguyễn Nhật Ánh",
    borrowDate: "15/01/2024",
    returnDeadline: "29/01/2024",
    status: "Đang mượn",
    statusType: "current",
    overdueDays: null,
    action: null
  },
  {
    id: 2,
    coverImage: "/img (1).png",
    title: "Số đỏ",
    author: "Vũ Trọng Phụng",
    borrowDate: "10/12/2023",
    returnDeadline: "24/12/2023",
    status: "Quá hạn",
    statusType: "overdue",
    overdueDays: 18,
    action: null
  },
  {
    id: 3,
    coverImage: "/img (2).png",
    title: "Dế Mèn phiêu lưu ký",
    author: "Tô Hoài",
    borrowDate: "05/11/2023",
    returnDeadline: "19/11/2023",
    status: "Đã trả",
    statusType: "returned",
    overdueDays: null,
    action: "Đã hoàn thành"
  }
];

export default function RentedBooks() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4; // Mock total pages

  const getStatusBadge = (_status: string, statusType: string) => {
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

      {/* Table */}
      <div className="overflow-x-auto">
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
            {sampleRentedBooks.map((book) => (
              <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                {/* Cover Image */}
                <td className="py-3 px-4">
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
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {book.title}
                  </div>
                </td>
                
                {/* Author */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {book.author}
                  </div>
                </td>
                
                {/* Borrow Date */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {book.borrowDate}
                  </div>
                </td>
                
                {/* Return Deadline */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {book.returnDeadline}
                  </div>
                </td>
                
                {/* Status */}
                <td className="py-3 px-4">
                  <span className={getStatusBadge(book.status, book.statusType)}>
                    {book.status}
                  </span>
                </td>
                
                {/* Overdue Days */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {book.overdueDays ? `...` : "-"}
                  </div>
                </td>
                
                {/* Action */}
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {book.action || ""}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showEllipsis={true}
          maxVisiblePages={3}
        />
      </div>
    </div>
  );
}
