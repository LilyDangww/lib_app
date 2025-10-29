"use client";

import BookCard from "@/components/BookCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { sampleBooks } from "../books/lib/sampleBooks";
import Autoplay from "embla-carousel-autoplay";

const FeaturedBooksSection = () => {
  // Get featured books (top rated books for example)
  const featuredBooks = sampleBooks
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <section className="py-16 px-4 md:px-8 lg:px-8 bg-white">
      {/* Carousel */}
      <div className="w-full max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl">Sách nổi bật</h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3500,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4 items-stretch px-1 py-2">
            {featuredBooks.map((book) => (
              <CarouselItem
                key={book.id}
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 h-full"
              >
                <BookCard
                  title={book.title}
                  author={book.author}
                  rating={book.rating}
                  availability={book.availability}
                  imageUrl={book.imageUrl}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons */}
          <CarouselPrevious className="left-0 sm:-left-5 -translate-x-1/2 bg-white hover:bg-gray-100 border-gray-300" />
          <CarouselNext className="right-0 sm:-right-5 translate-x-1/2 bg-white hover:bg-gray-100 border-gray-300" />
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedBooksSection;
