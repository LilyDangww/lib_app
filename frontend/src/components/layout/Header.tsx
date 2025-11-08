'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUser } from '@/hooks/useUser';
import { CartButton } from '@/components/cart';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, clearUser } = useUser();

  const handleLogout = () => {
    clearUser();
    router.push('/');
    router.refresh();
  };

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
            <CartButton />

            {/* User Info or Auth Links */}
            {isLoading ? (
              // Loading state
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              // User is logged in
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none">
                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-sm font-medium text-gray-700">
                        {user.username}
                      </span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                    <div className="md:hidden">
                      <span className="text-sm font-medium text-gray-700">
                        {user.username}
                      </span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    {/* User Info in Popover */}
                    <div className="px-2 py-1.5 border-b border-gray-200 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    {/* User Profile Link */}
                    <Link
                      href="/user"
                      className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 hover:bg-gray-50 transition-colors px-2 py-1.5 rounded-md"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Tài khoản</span>
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors px-2 py-1.5 rounded-md w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              // User is not logged in
              <>
                <Link 
                  href="/auth?tab=login" 
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Đăng nhập
                </Link>

                <Link 
                  href="/auth?tab=signup" 
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
