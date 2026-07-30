'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../_lib/api';

export default function ProfileLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const navLinks = [
    { href: '/profile', label: '👤 Hồ sơ cá nhân' },
    { href: '/profile/addresses', label: '📍 Sổ địa chỉ' },
    { href: '/profile/orders', label: '📦 Đơn hàng của tôi' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
        Quản lý tài khoản
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
