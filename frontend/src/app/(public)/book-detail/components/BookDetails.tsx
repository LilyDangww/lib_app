import type { Book } from '../lib/types';

interface BookDetailsProps {
  book: Book;
}

export default function BookDetails({ book }: BookDetailsProps) {
  const details = [
    {
      label: 'Thể loại',
      value: book.category
    },
    {
      label: 'Nhà xuất bản',
      value: book.publisher
    },
    {
      label: 'Năm xuất bản',
      value: book.publicationYear.toString()
    },
    {
      label: 'Số trang',
      value: book.pageCount.toString()
    },
    {
      label: 'Ngôn ngữ',
      value: book.language
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Thông tin chi tiết
      </h3>
      
      <div className="space-y-3">
        {details.map((detail) => (
          <div key={detail.label} className="flex">
            <div className="w-32 flex-shrink-0">
              <span className="text-gray-600 font-medium">
                {detail.label}:
              </span>
            </div>
            <div className="flex-1">
              <span className="text-gray-800">
                {detail.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
