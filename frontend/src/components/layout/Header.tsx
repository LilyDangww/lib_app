'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Helper function to get link classes based on active state
  const getLinkClasses = (href: string) => {
    const baseClasses = "transition-colors";
    const activeClasses = "text-teal-600 border-b-2 border-teal-600 font-medium";
    const inactiveClasses = "text-gray-600 hover:text-teal-600";
    
    return `${baseClasses} ${isActive(href) ? activeClasses : inactiveClasses}`;
  };

  return (
    <header className="bg-white border-t border-b border-gray-300/50 font-sans">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-teal-500 rounded-sm"></div>
                </div>
              </div>
              <span className="text-xl font-bold text-teal-600">D Free Book</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={getLinkClasses('/')}
              >
                Trang chủ
              </Link>
              <Link 
                href="/books" 
                className={getLinkClasses('/books')}
              >
                Sách
              </Link>
              <Link 
                href="/contact" 
                className={getLinkClasses('/contact')}
              >
                Liên hệ
              </Link>
            </nav>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-4">
            {/* Shopping Cart */}
            <button 
              type="button" 
              className="p-2 text-gray-600 hover:text-teal-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
            </button>

            {/* Login Link */}
            <Link 
              href="/auth?tab=login" 
              className="text-gray-600 hover:text-teal-600 transition-colors"
            >
              Đăng nhập
            </Link>

            {/* Register Button */}
            <Link 
              href="/auth?tab=signup" 
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
