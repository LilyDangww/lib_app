"use client";

import Image from "next/image";
import Link from "next/link";
import type { Book } from "../lib/types";

interface RelatedBooksProps {
  books: Book[];
  loading?: boolean;
}

export default function RelatedBooks({ books, loading }: RelatedBooksProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Sách cùng thể loại
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải sách liên quan...</p>
      ) : books.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có sách liên quan.</p>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/book-detail/${book.id}`}
              className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-20 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                  {book.imageUrl ? (
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      width={56}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-gray-600 text-center px-1">
                      Không có bìa
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 text-sm leading-snug line-clamp-2">
                  {book.title}
                </h4>
                {/* <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  {book.author}
                </p> */}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
