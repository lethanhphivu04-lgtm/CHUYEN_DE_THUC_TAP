'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '../../_lib/api';

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const loadUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    loadUser();

    // Listen for custom authentication changes (login/logout events)
    window.addEventListener('authChange', loadUser);

    return () => {
      window.removeEventListener('authChange', loadUser);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-2xl text-indigo-600 tracking-tight transition-all hover:opacity-90">
          HITU<span className="text-orange-500"> MARKET</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <Link href="/product" className="hover:text-indigo-600 transition-colors">Sản phẩm</Link>
          <Link href="/post" className="hover:text-indigo-600 transition-colors">Tin tức</Link>
          <Link href="/cart" className="hover:text-indigo-600 transition-colors">Giỏ hàng</Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4 text-sm font-medium">
              {user.roles && user.roles.includes('Admin') && (
                <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 rounded-md px-3 py-1.5 bg-indigo-50">
                  ⚙️ Quản trị
                </Link>
              )}
              {user.roles && user.roles.includes('Seller') && (
                <Link href="/seller" className="text-emerald-600 hover:text-emerald-800 transition-colors border border-emerald-200 rounded-md px-3 py-1.5 bg-emerald-50">
                  🏪 Kênh người bán
                </Link>
              )}
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition-colors">
                👤 {user.fullName || 'Tài khoản'}
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-sm font-medium">
              <Link href="/login" className="text-slate-700 hover:text-indigo-600 transition-colors">
                Đăng nhập
              </Link>
              <Link 
                href="/register" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all hover:scale-102 active:scale-98 shadow-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
