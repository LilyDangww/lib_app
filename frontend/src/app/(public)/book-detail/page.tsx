import Link from 'next/link';
import { sampleBook, relatedBooks } from './lib/sampleData';
import {
  BookOverview,
  BookDetails,
  BookReviews,
  RelatedBooks
} from './components';

export default function BookDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Trang chủ
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/books" className="text-gray-500 hover:text-gray-700">
                Sách
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-800 font-medium">
              {sampleBook.title}
            </li>
          </ol>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Book Overview */}
            <BookOverview book={sampleBook} />

            {/* Book Details */}
            <BookDetails book={sampleBook} />

            {/* Book Description */}
            {/* <BookDescription book={sampleBook} /> */}

            {/* Book Reviews */}
            <BookReviews book={sampleBook} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <RelatedBooks books={relatedBooks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
