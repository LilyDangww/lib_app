import type React from 'react';
import { useState } from 'react';

interface BooksFilterProps {
  onSearchChange?: (searchTerm: string) => void;
  onAuthorSearchChange?: (authorTerm: string) => void;
  onSortChange?: (sortBy: string) => void;
  onCategoryChange?: (category: string) => void;
}

const BooksFilter: React.FC<BooksFilterProps> = ({
  onSearchChange,
  onAuthorSearchChange,
  onSortChange,
  onCategoryChange
}) => {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [authorTerm, setAuthorTerm] = useState('');
  const [sortBy, setSortBy] = useState('');

  const categories = [
    'Tất cả',
    'Văn học',
    'Kinh tế',
    'Công nghệ',
    'Thiếu nhi',
    'Khoa học',
    'Kỹ năng',
    'Tâm lý',
    'Lịch sử'
  ];

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleAuthorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorTerm(value);
    onAuthorSearchChange?.(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSortBy(value);
    onSortChange?.(value);
  };

  return (
    <div className="mb-8">
      {/* Search and Sort Section */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Book Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Search icon">
                <title>Search</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Author Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="User icon">
                <title>User</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tác giả..."
              value={authorTerm}
              onChange={handleAuthorSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:w-48">
          <div className="relative">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors appearance-none bg-white"
            >
              <option value="">Sắp xếp</option>
              <option value="title-asc">Tên A-Z</option>
              <option value="title-desc">Tên Z-A</option>
              <option value="rating-desc">Đánh giá cao</option>
              <option value="rating-asc">Đánh giá thấp</option>
              <option value="availability-desc">Còn nhiều nhất</option>
              <option value="availability-asc">Còn ít nhất</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Dropdown arrow">
                <title>Dropdown</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                activeCategory === category
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-teal-300 hover:text-teal-600'
              }`}
            >
            {category}
          </button>
        ))}
      </div>

      {/* View More Button */}
      <button type="button" className="text-teal-600 border border-teal-500 bg-white px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors">
        Xem thêm
      </button>
    </div>
  );
};

export default BooksFilter;
