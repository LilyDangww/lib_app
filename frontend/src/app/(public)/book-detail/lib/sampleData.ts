import type { Book, RelatedBook } from './types';

export const sampleBook: Book = {
  id: '1',
  title: 'Lập trình Python cơ bản',
  author: 'Nguyễn Văn An',
  rating: 4.5,
  reviewCount: 24,
  viewCount: 1245,
  borrowCount: 89,
  availability: 'Có sẵn',
  category: 'Công nghệ thông tin',
  publisher: 'NXB Giáo dục',
  publicationYear: 2023,
  pageCount: 320,
  language: 'Tiếng Việt',
  description: 'Cuốn sách này cung cấp kiến thức cơ bản về lập trình Python, từ cú pháp cơ bản đến các khái niệm nâng cao. Phù hợp cho người mới bắt đầu học lập trình hoặc muốn chuyển sang Python từ ngôn ngữ khác.',
  imageUrl: '/python-book-cover.jpg',
  records: [
    {
      id: '1',
      accessCode: 'BK001-1',
      status: 'available',
      shelfLocation: 'Kệ A3 - Tầng 1'
    },
    {
      id: '2',
      accessCode: 'BK001-2',
      status: 'available',
      shelfLocation: 'Kệ A3 - Tầng 1'
    },
    {
      id: '3',
      accessCode: 'BK001-3',
      status: 'available',
      shelfLocation: 'Kệ B1 - Tầng 2'
    }
  ],
  reviews: [
    {
      id: '1',
      userName: 'Nguyễn Thị Mai',
      rating: 5,
      comment: 'Sách rất hay và dễ hiểu, phù hợp cho người mới bắt đầu học Python.',
      date: '2 ngày trước'
    }
  ]
};

export const relatedBooks: RelatedBook[] = [
  {
    id: '2',
    title: 'JavaScript từ cơ bản đến nâng cao',
    author: 'Trần Văn B',
    rating: 5,
    availability: 'Còn 3 cuốn',
    imageUrl: '/js-book-cover.jpg'
  },
  {
    id: '3',
    title: 'Lập trình Java hiệu quả',
    author: 'Lê Thị C',
    rating: 5,
    availability: 'Còn 5 cuốn',
    imageUrl: '/java-book-cover.jpg'
  }
];
