'use client';

import { useState } from 'react';
import type { Book } from '../lib/types';
import { ShoppingCart } from 'lucide-react';

interface BookAvailabilityProps {
  book: Book;
}

export default function BookAvailability({ book }: BookAvailabilityProps) {
  const [selectedRecord, setSelectedRecord] = useState<string>('');

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
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Chọn
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
                <td className="py-3 px-4">
                  <input
                    type="radio"
                    name="selectedRecord"
                    value={record.id}
                    checked={selectedRecord === record.id}
                    onChange={(e) => setSelectedRecord(e.target.value)}
                    disabled={record.status !== 'available'}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
            selectedRecord
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!selectedRecord}
        >
          <ShoppingCart />
          Thêm vào
        </button>
      </div>
    </div>
  );
}
