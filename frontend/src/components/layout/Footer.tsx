import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-300/50">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - D Free Book */}
          <div className="flex items-start space-x-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-4 h-4 bg-teal-500 rounded-sm"></div>
              </div>
            </div>
            
            {/* Brand Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">D Free Book</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Thư viện cộng đồng miễn phí<br />
                cho mọi người
              </p>
            </div>
          </div>

          {/* Middle Column - Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                  Sách
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column - Follow */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Theo dõi</h3>
            <div className="flex space-x-3">
              <a 
                href="https://facebook.com" 
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-teal-50 transition-colors"
              >
                <Facebook className="h-5 w-5 text-gray-600" />
              </a>
              <a 
                href="https://instagram.com" 
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-teal-50 transition-colors"
              >
                <Instagram className="h-5 w-5 text-gray-600" />
              </a>
              <a 
                href="https://youtube.com" 
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-teal-50 transition-colors"
              >
                <Youtube className="h-5 w-5 text-gray-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 D Free Book. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
