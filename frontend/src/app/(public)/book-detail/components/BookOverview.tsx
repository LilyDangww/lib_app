import Image from "next/image";
import type { Book } from "../lib/types";
import BookDescription from "./BookDescription";
import BookAvailabilityDialog from "./BookAvailabilityDialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface BookOverviewProps {
  book: Book;
}

export default function BookOverview({ book }: BookOverviewProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400 text-lg">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400 text-lg">
          ☆
        </span>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-lg">
          ☆
        </span>
      );
    }

    return stars;
  };

  return (
    <div className="flex gap-8 mb-8">
      {/* Book Cover */}
      <div className="flex-shrink-0">
        <div className="w-64 h-auto bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
          {book.imageUrl ? (
            <Image
              src={book.imageUrl}
              alt={book.title}
              width={320}
              height={384}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">Python</div>
              <div className="w-32 h-32 mx-auto bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="text-6xl">🐍</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h1>

        <p className="text-lg text-gray-600 mb-4">
          Tác giả: <span className="font-semibold">{book.author}</span>
        </p>

        {/* Rating and Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(book.rating)}</div>
            <span className="text-gray-700 font-medium">
              ({book.reviewCount} đánh giá)
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Eye icon"
              role="img"
            >
              <title>Lượt xem</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{book.viewCount.toLocaleString()} lượt xem</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Book icon"
            >
              <title>Book icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>{book.borrowCount} lượt mượn</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mb-6">
          <BookAvailabilityDialog book={book}>
            <Button className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
              <ShoppingCart className="w-4 h-4" />
              Thêm vào giỏ hàng
            </Button>
          </BookAvailabilityDialog>
        </div>

        <BookDescription book={book} />

      </div>
    </div>
  );
}
