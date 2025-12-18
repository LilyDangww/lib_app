"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOverview,
  BookDetails,
  BookReviews,
  RelatedBooks,
} from "../components";
import type { Book } from "../lib/types";
import { API_BASE_URL } from "@/utils/const";

// Transform API response to Book interface
const transformApiDocumentToBook = (apiDoc: any): Book => {
  type ApiAuthor = {
    id?: string | number;
    name?: string;
  };

  const rawAuthors: ApiAuthor[] = Array.isArray(apiDoc?.authors)
    ? apiDoc.authors
    : typeof apiDoc?.authors === "string" && apiDoc.authors
    ? [{ id: "unknown", name: apiDoc.authors }]
    : [];

  const normalizedAuthors = rawAuthors
    .filter(
      (author): author is ApiAuthor & { name: string } =>
        typeof author?.name === "string" && author.name.trim().length > 0
    )
    .map((author, index) => ({
      id:
        author.id !== undefined && author.id !== null
          ? author.id.toString()
          : index.toString(),
      name: author.name,
    }));

  const authorNames = normalizedAuthors.map((author) => author.name);
  const authorText =
    authorNames.length > 0 ? authorNames.join(", ") : "Không có tác giả";

  const stats = apiDoc?.stats ?? {};
  const availableCount =
    typeof stats.available_count === "number"
      ? stats.available_count
      : typeof apiDoc?.available_count === "number"
      ? apiDoc.available_count
      : 0;

  const averageRating =
    typeof stats.avg_rating === "number"
      ? stats.avg_rating
      : typeof apiDoc?.avg_rating === "number"
      ? apiDoc.avg_rating
      : 0;

  const reviewCount =
    typeof stats.review_count === "number"
      ? stats.review_count
      : Array.isArray(apiDoc.reviews)
      ? apiDoc.reviews.length
      : 0;

  // 👇 lấy lượt mượn từ stats.borrow_count
  const borrowCount =
    typeof stats.borrow_count === "number"
      ? stats.borrow_count
      : typeof apiDoc.total_borrowed === "number"
      ? apiDoc.total_borrowed
      : 0;

  // Chuẩn hóa reviews từ API
  const rawReviews: any[] = Array.isArray(apiDoc.reviews) ? apiDoc.reviews : [];

  const normalizedReviews = rawReviews.map((r, index) => ({
    id: r.id ?? index,
    userName:
      r.reviewer?.username ||
      r.reviewer?.name ||
      r.user_name ||
      "Người dùng ẩn danh",
    rating: Number(r.rating) || 0,
    comment: r.content || r.comment || "",
    date: r.created_at || r.updated_at || null,
  }));

  return {
    id: apiDoc.id?.toString() ?? "",
    title: apiDoc.name || "Không có tiêu đề",
    author: authorText,
    authors: normalizedAuthors,
    rating: Number(averageRating) || 0,
    reviewCount,
    viewCount: 0,
    borrowCount,
    availability:
      availableCount > 0 ? `Còn ${availableCount} cuốn` : "Hết sách",
    category: apiDoc.category?.name || "Không có thể loại",
    categoryId:
      typeof apiDoc.category?.id === "number" ? apiDoc.category.id : undefined,
    publisher: apiDoc.publisher?.name || "Không có nhà xuất bản",
    publicationYear: apiDoc.published_year || 0,
    pageCount: apiDoc.page_nums || 0,
    language: "Tiếng Việt",
    description: apiDoc.description || "Chưa có mô tả",
    imageUrl: apiDoc.image_url,
    records: apiDoc.records ?? [],
    reviews: normalizedReviews, // 👈 dùng reviews đã chuẩn hóa
  };
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy chi tiết sách
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);

        const id = params.id;
        if (!id) {
          throw new Error("Book ID is required");
        }

        const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Không tìm thấy sách");
          }
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch book details" }));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        const transformedBook = transformApiDocumentToBook(data);
        setBook(transformedBook);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch book details"
        );
        console.error("Error fetching book:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  // Lấy sách liên quan cùng thể loại (sau khi đã có book)
  useEffect(() => {
    const fetchRelatedBooks = async () => {
      if (!book?.id || !book.categoryId) {
        console.log("Skip related: missing book.id or categoryId", book);
        return;
      }

      try {
        setLoadingRelated(true);

        const params = new URLSearchParams({
          categoryId: String(book.categoryId),
          excludeId: book.id,
          limit: "6",
        });

        const res = await fetch(
          `${API_BASE_URL}/documents/related?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("related status:", res.status);

        if (!res.ok) {
          console.error("Failed to fetch related books");
          return;
        }

        const data = await res.json();
        console.log("related raw data:", data);

        const list = Array.isArray(data) ? data : data.data ?? [];

        const transformed: Book[] = list
          .map((doc: any) => transformApiDocumentToBook(doc))
          .filter((b: Book) => b.id !== book.id);

        console.log("related transformed:", transformed);
        setRelatedBooks(transformed);
      } catch (err) {
        console.error("Error fetching related books:", err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedBooks();
  }, [book?.id, book?.categoryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sách...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-semibold mb-2">Lỗi:</p>
            <p className="text-red-600 mb-4">
              {error || "Không tìm thấy thông tin sách"}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Quay lại
              </button>
              <Link
                href="/books"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Xem danh sách sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <li className="text-gray-800 font-medium">{book.title}</li>
          </ol>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <BookOverview book={book} />
            <BookDetails book={book} />
            <BookReviews book={book} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <RelatedBooks books={relatedBooks} loading={loadingRelated} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
