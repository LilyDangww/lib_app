import type React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const BooksHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Danh mục sách</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-4 text-left">
        Danh mục sách
      </h1>
      <p className="text-lg text-gray-700">
        Khám phá bộ sưu tập sách phong phú của chúng tôi
      </p> */}
    </div>
  );
};

export default BooksHeader;
