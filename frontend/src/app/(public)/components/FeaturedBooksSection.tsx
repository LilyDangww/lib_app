"use client";

import { useEffect, useState } from "react";
import BookCard from "@/components/BookCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

type FeaturedBook = {
  id: number | string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  imageUrl?: string | null;
};

const FeaturedBooksSection = () => {
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: "1",
          limit: "20",
        });

        const url = `${API_BASE_URL}/documents/readers?${params.toString()}`;
        console.log("featured URL:", url);

        const res = await fetch(url);
        console.log("featured status:", res.status);

        if (!res.ok) {
          let errJson: any = null;
          try {
            errJson = await res.json();
          } catch {
            // ignore
          }
          console.error(
            "Failed to fetch featured books",
            res.status,
            errJson ?? "<no json body>"
          );
          return;
        }

        let data: any;
        try {
          data = await res.json();
        } catch (e) {
          console.error("featured: cannot parse JSON", e);
          return;
        }

        console.log("featured raw data:", data);

        // 👉 TẠM THỜI: log để biết key thật
        if (data && typeof data === "object") {
          console.log("featured data keys:", Object.keys(data));
        }

        // ❗ SAU KHI XEM LOG, CHỈNH LẠI DÒNG NÀY CHO ĐÚNG:
        //   - nếu BE trả { data: [...] }  -> dùng data.data
        //   - nếu BE trả { documents: [...] } -> dùng data.documents
        //   - nếu BE trả [...], mảng trực tiếp -> dùng data
        const rows: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray((data as any).documents)
          ? (data as any).documents
          : Array.isArray(data.rows)
          ? data.rows
          : [];

        console.log("featured rows:", rows);

        if (!rows.length) {
          console.warn(
            "featured: rows is empty, check raw data + featured data keys log"
          );
        }

        const mapped: FeaturedBook[] = rows.map((item: any, index: number) => ({
          id: item.id ?? index,
          title: item.name || item.title || "Không có tiêu đề",
          author:
            typeof item.authors === "string"
              ? item.authors
              : Array.isArray(item.authors)
              ? item.authors.map((a: any) => a.name).join(", ")
              : "Không có tác giả",
          rating:
            typeof item.avg_rating === "number"
              ? item.avg_rating
              : typeof item.rating === "number"
              ? item.rating
              : 0,
          availability:
            typeof item.available_count === "number" && item.available_count > 0
              ? `Còn ${item.available_count} cuốn`
              : "Hết sách",
          imageUrl: item.image_url || item.imageUrl || null,
        }));

        console.log("featured mapped:", mapped);
        setFeaturedBooks(mapped.slice(0, 8));
      } catch (err) {
        console.error("Error fetch featured books:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, []);

  return (
    <section className="py-16 px-4 md:px-8 lg:px-8 bg-white">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl">Sách nổi bật</h2>
        </div>

        {loading ? (
          <p className="text-gray-500">Đang tải sách nổi bật...</p>
        ) : featuredBooks.length === 0 ? (
          <p className="text-gray-500">Chưa có sách nổi bật.</p>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 3500 })]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 items-stretch px-1 py-2">
              {featuredBooks.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 h-full"
                >
                  <BookCard
                    id={book.id.toString()}
                    title={book.title}
                    author={book.author}
                    rating={book.rating}
                    availability={book.availability}
                    imageUrl={book.imageUrl}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 sm:-left-5 -translate-x-1/2 bg-white hover:bg-gray-100 border-gray-300" />
            <CarouselNext className="right-0 sm:-right-5 translate-x-1/2 bg-white hover:bg-gray-100 border-gray-300" />
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default FeaturedBooksSection;
