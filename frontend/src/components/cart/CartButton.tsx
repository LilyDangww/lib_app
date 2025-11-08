'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { useCartStore } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '@/utils/const';

import CartItemCard from './CartItemCard';

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const [holdType, setHoldType] = useState<'hard' | 'soft'>('hard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const items = useCartStore(useShallow((state) => state.items));
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const itemCount = items.length;
  const hasItems = itemCount > 0;
  const overLimit = itemCount > 2;

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.addedAt - a.addedAt),
    [items]
  );

  const handleRemove = (bookId: string) => {
    const removed = removeItem(bookId);
    if (removed) {
      toast.success('Đã xóa sách khỏi giỏ');
    }
  };

  const handleClear = () => {
    if (!hasItems) {
      return;
    }
    clearCart();
    toast.success('Đã làm trống giỏ sách');
  };

  const handleReservation = async () => {
    if (!hasItems) {
      toast.info('Giỏ sách đang trống, hãy thêm sách trước.');
      return;
    }

    if (overLimit) {
      toast.error('Bạn chỉ có thể giữ tối đa 2 tài liệu trong một lần.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      toast.error('Bạn cần đăng nhập để tạo phiếu giữ.');
      return;
    }

    const documentIds = items.map((item) => item.bookId);

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hold_type: holdType,
          document_ids: documentIds,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || 'Không thể tạo phiếu giữ, vui lòng thử lại.');
      }

      toast.success('Đã tạo phiếu giữ thành công.');
      clearCart();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-teal-50 hover:text-teal-600"
          aria-label="Mở giỏ sách"
        >
          <ShoppingCart className="h-6 w-6" />
          {hasItems && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] font-semibold text-white">
              {itemCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden rounded-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Giỏ sách của bạn
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {hasItems ? (
            <>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {sortedItems.map((item) => (
                  <CartItemCard
                    key={item.bookId}
                    item={item}
                    onRemove={() => handleRemove(item.bookId)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-800">{itemCount}</span>{' '}
                    {itemCount === 1 ? 'cuốn sách' : 'cuốn sách'} trong giỏ
                  </div>
                  <div className={overLimit ? 'text-red-600' : 'text-gray-500'}>
                    Tối đa 2 tài liệu mỗi phiếu giữ.{` `}
                    {overLimit && 'Vui lòng giữ lại 2 tài liệu hoặc ít hơn.'}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* <div className="w-full sm:w-1/2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hình thức giữ sách
                    </label>
                    <Select
                      value={holdType}
                      onValueChange={(value) => setHoldType(value as 'hard' | 'soft')}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Chọn hình thức giữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hard">Giữ tại thư viện (hard hold)</SelectItem>
                        <SelectItem value="soft">Giữ tạm thời (soft hold)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={!hasItems || isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa tất cả
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleReservation}
                      disabled={!hasItems || overLimit || isSubmitting}
                    >
                      {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu giữ'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-200 py-12 text-center text-gray-500">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Giỏ sách trống</p>
                <p className="text-xs text-gray-500">
                  Thêm sách từ trang chi tiết để bắt đầu mượn.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

