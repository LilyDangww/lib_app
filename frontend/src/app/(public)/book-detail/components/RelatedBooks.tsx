import Image from 'next/image';
import type { RelatedBook } from '../lib/types';

interface RelatedBooksProps {
  books: RelatedBook[];
}

export default function RelatedBooks({ books }: RelatedBooksProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-sm ${
            i < rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Sách cùng chủ đề
      </h3>
      
      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="w-16 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex items-center justify-center">
                {book.imageUrl ? (
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    width={64}
                    height={80}
                    className="object-cover w-full h-full rounded-md"
                  />
                ) : (
                  <div className="text-center text-white">
                    <div className="text-xs font-bold">
                      {book.title.includes('JavaScript') ? 'JS' : 
                       book.title.includes('Java') ? 'Java' : '📚'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                {book.title}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2">
                {book.author}
              </p>
              
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {renderStars(book.rating)}
                </div>
              </div>
              
              <p className="text-xs text-green-600 font-medium">
                {book.availability}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
