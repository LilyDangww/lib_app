import type React from 'react';
import Link from 'next/link';

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  imageUrl?: string;
  className?: string;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  rating,
  availability,
  imageUrl,
  className = ""
}) => {
  // Generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, index) => (
          <svg
            key={`full-star-${Math.random()}-${index}`}
            className="w-4 h-4 text-yellow-400 fill-current"
            viewBox="0 0 20 20"
            aria-label={`Full star ${index + 1}`}
          >
            <title>Full star</title>
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <svg
              className="w-4 h-4 text-gray-300 fill-current"
              viewBox="0 0 20 20"
              aria-label="Half star"
            >
              <title>Half star</title>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <svg
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
                aria-label="Half star filled"
              >
                <title>Half star filled</title>
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, index) => (
          <svg
            key={`empty-star-${Math.random()}-${index}`}
            className="w-4 h-4 text-gray-300 fill-current"
            viewBox="0 0 20 20"
            aria-label={`Empty star ${index + 1}`}
          >
            <title>Empty star</title>
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <Link href={`/book-detail/${id}`}>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-[1.01] hover:cursor-pointer ${className}`}>
        {/* Book Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-sky-100 to-blue-200">
        {imageUrl ? (
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
        ) : (
          // Default Japanese-style landscape
          <div className="w-full h-full relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-blue-200" />
            
            {/* Moon/Sun circle */}
            <div className="absolute top-8 right-12 w-16 h-16 bg-yellow-100 rounded-full shadow-sm" />
            
            {/* Mountain layers */}
            <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-blue-800 to-blue-600" />
            <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-blue-700 to-blue-500" />
            <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-blue-600 to-blue-400" />
            
            {/* Cherry blossom branches */}
            <div className="absolute top-4 left-4 w-8 h-20">
              <div className="w-1 h-16 bg-pink-200 absolute left-2" />
              <div className="absolute top-2 left-1 w-2 h-2 bg-pink-300 rounded-full" />
              <div className="absolute top-6 left-0 w-2 h-2 bg-pink-300 rounded-full" />
              <div className="absolute top-10 left-2 w-2 h-2 bg-pink-300 rounded-full" />
              <div className="absolute top-14 left-1 w-2 h-2 bg-pink-300 rounded-full" />
            </div>
            
            <div className="absolute bottom-8 left-6 w-6 h-12">
              <div className="w-1 h-10 bg-pink-200 absolute left-1" />
              <div className="absolute top-1 left-0 w-1.5 h-1.5 bg-pink-300 rounded-full" />
              <div className="absolute top-4 left-1 w-1.5 h-1.5 bg-pink-300 rounded-full" />
              <div className="absolute top-7 left-0 w-1.5 h-1.5 bg-pink-300 rounded-full" />
            </div>
            
            {/* N LITERATURE text overlay */}
            <div className="absolute top-4 right-4 text-right">
              <div className="text-2xl font-bold text-gray-800">N</div>
              <div className="text-xs font-medium text-gray-700 tracking-wider">LITERATURE</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Book Information */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="text-lg line-clamp-1">
          {title}
        </h3>
        
        {/* Author */}
        <p className="text-sm text-gray-700">
          {author}
        </p>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          {renderStars(rating)}
          <span className="text-sm text-gray-600">
            ({rating.toFixed(1)})
          </span>
        </div>
        
        {/* Availability */}
        <p className="text-sm text-teal-600 font-medium">
          {availability}
        </p>
      </div>
      </div>
    </Link>
  );
};

export default BookCard;
