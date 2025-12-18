import Image from "next/image";
import type { Book } from "../lib/types";
import BookDescription from "./BookDescription";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useCartStore } from "@/store";

interface BookOverviewProps {
  book: Book;
}

export default function BookOverview({ book }: BookOverviewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.hasItem(book.id));

  const authorList = book.authors?.map((author) => author.name).filter(Boolean);

  const handleAddToCart = () => {
    if (isInCart) {
      toast.info("Sách này đã có trong giỏ");
      return;
    }

    const result = addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      availability: book.availability,
      imageUrl: book.imageUrl,
    });

    if (result.added) {
      toast.success("Đã thêm sách vào giỏ");
    } else {
      toast.info("Sách này đã có trong giỏ");
    }
  };

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

        <div className="text-lg text-gray-600 mb-4">
          <span className="mr-2">Tác giả:</span>
          {authorList && authorList.length > 0 ? (
            <div className="inline-flex flex-wrap gap-2 align-top">
              {book.authors?.map((author, index) => (
                <span
                  key={author.id}
                  className="inline-flex items-center rounded-full bg-teal-50 font-semibold text-[#4F777A]"
                >
                  {author.name}
                  {index < authorList.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-semibold">{book.author}</span>
          )}
        </div>

        {/* Rating and Stats */}
        <div className="flex items-center gap-6 mb-6">
          {/* Rating + số đánh giá */}
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(book.rating)}</div>
            <span className="text-gray-700 font-medium">
              ({book.reviewCount} đánh giá)
            </span>
          </div>

          {/* Chỉ hiển thị lượt mượn */}
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>{book.borrowCount.toLocaleString("vi-VN")} lượt mượn</span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mb-6">
          <Button
            className="flex items-center gap-2 px-6 py-3 bg-[#4F777A] hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
            type="button"
            onClick={handleAddToCart}
            disabled={isInCart}
          >
            <ShoppingCart className="w-4 h-4" />
            {isInCart ? "Đã trong giỏ" : "Thêm vào giỏ hàng"}
          </Button>
        </div>

        <BookDescription book={book} />
      </div>
    </div>
  );
}
