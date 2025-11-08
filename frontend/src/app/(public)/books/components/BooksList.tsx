import BookCard from '@/components/BookCard';
import type React from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  imageUrl?: string;
}

interface BooksListProps {
  books: Book[];
  className?: string;
}

const BooksList: React.FC<BooksListProps> = ({ books, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          id={book.id}
          title={book.title}
          author={book.author}
          rating={book.rating}
          availability={book.availability}
          imageUrl={book.imageUrl}
        />
      ))}
    </div>
  );
};

export default BooksList;
