export interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  availability: string;
  category: string;
  imageUrl?: string;
}

export const sampleBooks: Book[] = [
  {
    id: '1',
    title: 'Số đỏ',
    author: 'Vũ Trọng Phụng',
    rating: 4.2,
    availability: 'Còn 8 cuốn',
    category: 'Văn học',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '2',
    title: 'Kinh tế học vi mô',
    author: 'Gregory Mankiw',
    rating: 4.8,
    availability: 'Còn 3 cuốn',
    category: 'Kinh tế',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '3',
    title: 'Clean Code: Nghệ thuật viết code sạch',
    author: 'Robert C. Martin',
    rating: 4.9,
    availability: 'Còn 12 cuốn',
    category: 'Công nghệ',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '4',
    title: 'Dế Mèn phiêu lưu ký',
    author: 'Tô Hoài',
    rating: 4.3,
    availability: 'Còn 15 cuốn',
    category: 'Thiếu nhi',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '5',
    title: 'Vật lý đại cương',
    author: 'David Halliday',
    rating: 4.1,
    availability: 'Còn 7 cuốn',
    category: 'Khoa học',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '6',
    title: '7 thói quen hiệu quả',
    author: 'Stephen R. Covey',
    rating: 4.7,
    availability: 'Còn 6 cuốn',
    category: 'Kỹ năng',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '7',
    title: 'Tâm lý học tích cực',
    author: 'Martin Seligman',
    rating: 4.4,
    availability: 'Còn 9 cuốn',
    category: 'Tâm lý',
    imageUrl: undefined // Will use default cover
  },
  {
    id: '8',
    title: 'Lịch sử Việt Nam',
    author: 'Trần Trọng Kim',
    rating: 4.6,
    availability: 'Còn 4 cuốn',
    category: 'Lịch sử',
    imageUrl: undefined // Will use default cover
  }
];
