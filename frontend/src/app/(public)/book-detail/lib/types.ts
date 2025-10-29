export interface BookRecord {
  id: string;
  accessCode: string;
  status: 'available' | 'borrowed' | 'reserved';
  shelfLocation: string;
}

export interface BookReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  borrowCount: number;
  availability: string;
  category: string;
  publisher: string;
  publicationYear: number;
  pageCount: number;
  language: string;
  description: string;
  imageUrl?: string;
  records: BookRecord[];
  reviews: BookReview[];
}

export interface RelatedBook {
  id: string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  imageUrl?: string;
}
