"use client";

import { useState, useEffect, useMemo } from "react";
import BooksHeader from "./components/BooksHeader";
import BooksFilter from "./components/BooksFilter";
import BooksList from "./components/BooksList";
import Pagination from "@/components/Pagination";
import { API_BASE_URL } from "@/utils/const";

interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  imageUrl?: string;
}

interface ApiAuthor {
  id?: number | string;
  name: string;
}

interface ApiDocument {
  id: number;
  name: string;
  authors: ApiAuthor[] | string | null;
  avg_rating: number;
  available_count: number;
  total_borrowed: number;
  image_url: string;
  stats: {
    available_count: number;
  };
}

interface ApiResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: ApiDocument[];
}

// Map frontend sort options to backend sort parameters
const mapSortOption = (sortBy: string): string | null => {
  switch (sortBy) {
    case "title-asc":
      return "name_asc";
    case "title-desc":
      return "name_desc";
    case "rating-desc":
      return "rating_high";
    case "rating-asc":
      return "rating_low";
    case "availability-desc":
      return "available_most";
    case "availability-asc":
      return "available_least";
    default:
      return null;
  }
};

// Transform API response to Book interface
const transformDocumentToBook = (doc: ApiDocument): Book => {
  const authorsArray = Array.isArray(doc.authors)
    ? doc.authors.filter((author): author is ApiAuthor => {
        return (
          typeof author?.name === "string" && author.name.trim().length > 0
        );
      })
    : typeof doc.authors === "string" && doc.authors
    ? [{ name: doc.authors }]
    : [];

  const authorNames = authorsArray.map((author) => author.name);

  return {
    id: doc.id.toString(),
    title: doc.name,
    author:
      authorNames.length > 0 ? authorNames.join(", ") : "Không có tác giả",
    rating: Number(doc.avg_rating) || 0,
    availability:
      doc.available_count > 0 ? `Còn ${doc.available_count} cuốn` : "Hết sách",
    imageUrl: doc.image_url,
  };
};

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [authorTerm, setAuthorTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 12,
  });

  // Combine search and author search into one search parameter
  // The API searches both document name and author name
  const combinedSearch = useMemo(() => {
    if (searchTerm && authorTerm) {
      return `${searchTerm} ${authorTerm}`;
    }
    return searchTerm || authorTerm || null;
  }, [searchTerm, authorTerm]);

  // Debounce search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(combinedSearch);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [combinedSearch]);

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "12",
        });

        // Add search parameter (API searches both name and author)
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        // Add sort parameter
        const sortParam = mapSortOption(sortBy);
        if (sortParam) {
          params.append("sort", sortParam);
        }

        // Note: Category filtering by ID would require a categories API
        // For now, we'll skip category_id filtering
        // TODO: Add category name to ID mapping when categories API is available

        const response = await fetch(
          `${API_BASE_URL}/documents?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to fetch books",
          }));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: ApiResponse = await response.json();

        // Transform API documents to books
        const transformedBooks = data.data.map(transformDocumentToBook);
        setBooks(transformedBooks);
        setPagination({
          total: data.total,
          totalPages: data.totalPages,
          page: data.page,
          limit: data.limit,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch books");
        console.error("Error fetching books:", err);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentPage, debouncedSearch, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <BooksHeader />
        <BooksFilter
          onSearchChange={setSearchTerm}
          onAuthorSearchChange={setAuthorTerm}
          onSortChange={setSortBy}
          onCategoryChange={setSelectedCategory}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F777A]"></div>
            <p className="mt-4 text-gray-600">Đang tải sách...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold mb-2">Lỗi:</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                setCurrentPage(1);
                setError(null);
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Books List */}
        {!loading && !error && (
          <>
            {books.length > 0 ? (
              <>
                <BooksList books={books} />
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Không tìm thấy sách nào</p>
                <p className="text-gray-500 text-sm mt-2">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
