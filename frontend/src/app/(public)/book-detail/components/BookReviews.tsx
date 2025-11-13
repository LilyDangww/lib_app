/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <> */
"use client";

import { useState } from "react";
import type { Book } from "../lib/types";

interface BookReviewsProps {
  book: Book;
}

export default function BookReviews({ book }: BookReviewsProps) {
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={`rating-star-${i}`}
          type="button"
          onClick={() => setUserRating(i)}
          className={`text-2xl transition-colors ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400`}
        >
          {i <= rating ? "★" : "☆"}
        </button>
      );
    }
    return stars;
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle review submission
    console.log("Review submitted:", {
      rating: userRating,
      comment: reviewText,
    });
    setUserRating(0);
    setReviewText("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Đánh giá bạn đọc
      </h3>

      {/* Overall Rating */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-800">
            {book.rating}
          </span>
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={`overall-star-${Date.now()}-${i}`}
                className={`text-lg ${
                  i < Math.floor(book.rating)
                    ? "text-yellow-400"
                    : i < book.rating
                    ? "text-yellow-400 opacity-50"
                    : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-gray-600">
            Dựa trên {book.reviewCount} đánh giá
          </span>
        </div>
      </div>

      {/* Existing Reviews */}
      {book.reviews.length > 0 && (
        <div className="space-y-4 mb-6">
          {book.reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {review.userName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {review.userName}
                  </div>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>
                <div className="flex ml-auto">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={`review-${review.id}-star-${i}`}
                      className={`text-sm ${
                        i < review.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 ml-11">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Form */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Viết đánh giá
        </h4>

        <form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Rating Input */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Đánh giá:</span>
            <div className="flex">{renderStars(userRating)}</div>
          </div>

          {/* Comment Input */}
          <div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[#4F777A] hover:bg-[#4F777A] text-white font-medium rounded-lg transition-colors"
            >
              Gửi đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
