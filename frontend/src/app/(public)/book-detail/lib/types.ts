export interface BookRecord {
  id: string;
  accessCode: string;
  status: "available" | "borrowed" | "reserved";
  shelfLocation: string;
}

export interface BookReview {
  id: string;
  userName: string;
  // userAvatar?: string;
  rating: number;
  comment: string;
  date?: string | null;
}

export interface BookAuthor {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  authors: { id: string; name: string }[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  borrowCount: number;
  availability: string;
  category: string;
  categoryId?: number;
  publisher: string;
  publicationYear: number;
  pageCount: number;
  language: string;
  description: string;
  imageUrl?: string | null;
  records: any[];
  reviews: any[];
}

export interface RelatedBook {
  id: number;
  title: string;
  author: string;
  imageUrl?: string | null;
  rating: number;
  availability: string;
  // nếu backend có thêm categoryId, slug... thì có thể bổ sung
}
