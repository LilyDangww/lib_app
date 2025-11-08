'use client';

import { Trash2 } from 'lucide-react';

import type { CartItem } from '@/store';

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
}

export default function CartItemCard({ item, onRemove }: CartItemCardProps) {
  const initial = item.title?.trim().charAt(0)?.toUpperCase() ?? 'B';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-teal-300">
      <div className="flex h-20 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-teal-100 via-white to-sky-200 text-base font-semibold text-teal-700">
        {item.imageUrl ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
            aria-label={item.title}
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs text-gray-500">{item.author}</p>
        {/* {item.availability && (
          <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {item.availability}
          </div>
        )} */}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="ml-2 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label={`Xóa ${item.title} khỏi giỏ hàng`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

