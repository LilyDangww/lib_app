'use client';

import { useState } from 'react';
import type { Book } from '../lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShoppingCart } from 'lucide-react';

interface BookAvailabilityDialogProps {
  book: Book;
  children: React.ReactNode;
}

export default function BookAvailabilityDialog({ book, children }: BookAvailabilityDialogProps) {
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [open, setOpen] = useState(false);

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

  const handleAddToCart = () => {
    if (selectedRecord) {
      // Handle add to cart logic here
      console.log('Added to cart:', selectedRecord);
      setOpen(false);
      setSelectedRecord('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Chọn bản ghi sách
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Vui lòng chọn một bản ghi sách để thêm vào giỏ hàng
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Book Info */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20 h-24 bg-gradient-to-br from-blue-900 to-blue-700 rounded-md flex items-center justify-center">
              <div className="text-white text-sm font-bold">Python</div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{book.title}</h3>
              <p className="text-gray-600">Tác giả: {book.author}</p>
              <p className="text-sm text-gray-500">Thể loại: {book.category}</p>
            </div>
          </div>

          {/* Records Table */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Danh sách bản ghi
            </h4>
            
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
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedRecord}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedRecord
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
