"use client";

import { useState, useMemo } from "react";
import BooksHeader from "./components/BooksHeader";
import BooksFilter from "./components/BooksFilter";
import BooksList from "./components/BooksList";
import { sampleBooks } from "./lib/sampleBooks";

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [authorTerm, setAuthorTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = sampleBooks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by author
    if (authorTerm) {
      filtered = filtered.filter((book) =>
        book.author.toLowerCase().includes(authorTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter((book) => book.category === selectedCategory);
    }

    // Sort books
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "rating-desc":
            return b.rating - a.rating;
          case "rating-asc":
            return a.rating - b.rating;
          case "availability-desc":
            return (
              parseInt(b.availability.match(/\d+/)?.[0] || "0") -
              parseInt(a.availability.match(/\d+/)?.[0] || "0")
            );
          case "availability-asc":
            return (
              parseInt(a.availability.match(/\d+/)?.[0] || "0") -
              parseInt(b.availability.match(/\d+/)?.[0] || "0")
            );
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [searchTerm, authorTerm, sortBy, selectedCategory]);

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
        <BooksList books={filteredBooks} />
      </div>
    </div>
  );
}
