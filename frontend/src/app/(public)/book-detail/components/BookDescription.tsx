import type { Book } from '../lib/types';

interface BookDescriptionProps {
  book: Book;
}

export default function BookDescription({ book }: BookDescriptionProps) {
  return (
    <div className="mb-6">
      {/* <h3 className="text-md font-semibold text-gray-800 mb-4">
        Mô tả sách
      </h3> */}
      
      <div className="text-gray-700 leading-relaxed">
        <p>{book.description}</p>
      </div>
    </div>
  );
}
