'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '../_components/admin/Header';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: '📊 Dashboard' },
    { href: '/admin/user', label: '👥 Quản Lý Người Dùng' },
    { href: '/admin/category', label: '📁 Quản Lý Danh Mục' },
    { href: '/admin/product', label: '📦 Quản Lý Sản Phẩm' },
    { href: '/admin/voucher', label: '🎫 Quản Lý Voucher' },
    { href: '/admin/order', label: '🧾 Quản Lý Đơn Hàng' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-68 bg-slate-900 border-r border-slate-800 text-slate-200 p-5 space-y-6 font-medium text-sm hidden md:block">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pb-3 border-b border-slate-800/80">
              Quản lý hệ thống
            </div>
            
            <nav className="space-y-1.5 pt-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
