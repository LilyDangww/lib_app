'use client';

import type { Book } from '../lib/types';

interface BookAvailabilityProps {
  book: Book;
}

export default function BookAvailability({ book }: BookAvailabilityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'borrowed':
        return 'text-red-600 bg-red-100';
      case 'reserved':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Có sẵn';
      case 'borrowed':
        return 'Đã mượn';
      case 'reserved':
        return 'Đã đặt';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Danh sách bản ghi
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Mã quyền
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Trạng thái
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Vị trí kệ
              </th>
            </tr>
          </thead>
          <tbody>
            {book.records.map((record) => (
              <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-800 font-medium">
                  {record.accessCode}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {record.shelfLocation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
