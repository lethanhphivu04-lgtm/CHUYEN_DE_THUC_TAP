import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-2xl text-indigo-600 tracking-tight">
          HITU<span className="text-orange-500"> MARKET</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <Link href="/product" className="hover:text-indigo-600 transition-colors">Sản phẩm</Link>
          <Link href="/post" className="hover:text-indigo-600 transition-colors">Tin tức</Link>
          <Link href="/cart" className="hover:text-indigo-600 transition-colors">Giỏ hàng</Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Link href="/customer" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            Tài khoản
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
