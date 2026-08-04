'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../_lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    const user = authService.getCurrentUser();
    if (user) {
      if (user.roles && user.roles.includes('Admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      // Success, trigger navigation and header update
      window.dispatchEvent(new Event('authChange'));

      if (data.user && data.user.roles && data.user.roles.includes('Admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      // Do not use console.error for expected 401/400 auth errors to prevent Next.js dev overlay
      if (!err.response || (err.response.status !== 401 && err.response.status !== 400)) {
        console.error('Lỗi kết nối máy chủ:', err);
      }
      setError(
        err.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng trở lại!
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Đăng nhập vào tài khoản <span className="font-semibold text-indigo-600">HITU MARKET</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm relative" role="alert">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                Địa chỉ Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3.5 py-2.5 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                placeholder="ten@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3.5 py-2.5 pr-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-indigo-400 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              Đăng Nhập
            </button>
          </div>
        </form>

        {/* Demo Accounts Quick Select */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">
            🔑 Tài khoản mẫu (Click để điền nhanh)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@gmail.com', 'Admin123!')}
              className="px-2.5 py-2 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('seller1@gmail.com', 'Seller123!')}
              className="px-2.5 py-2 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              🏪 Seller
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('customer@gmail.com', 'Member123!')}
              className="px-2.5 py-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              🛒 Khách
            </button>
          </div>

          <div className="relative">
            <select
              id="demo-accounts"
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [demoEmail, demoPassword] = val.split('|');
                fillDemoAccount(demoEmail, demoPassword);
                e.target.value = '';
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22feather%20feather-chevron-down%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="">-- Danh sách tài khoản mẫu khác --</option>
              
              <optgroup label="👑 Quản trị viên (Admin)">
                <option value="admin@gmail.com|Admin123!">admin@gmail.com (Hệ Thống Admin)</option>
                <option value="admin@marketplace.vn|Admin123!">admin@marketplace.vn (Hệ Thống Admin 2)</option>
              </optgroup>

              <optgroup label="🏪 Người bán (Seller)">
                <option value="seller1@gmail.com|Seller123!">seller1@gmail.com (HITU Official Store)</option>
                <option value="seller2@gmail.com|Seller123!">seller2@gmail.com (Phong Cách Viet Fashion)</option>
                <option value="seller3@gmail.com|Seller123!">seller3@gmail.com (Gia Dụng Xanh SmartHome)</option>
                <option value="seller4@gmail.com|Seller123!">seller4@gmail.com (Beauty & Care Official)</option>
                <option value="seller5@gmail.com|Seller123!">seller5@gmail.com (SportLife Việt Nam)</option>
                <option value="seller6@gmail.com|Seller123!">seller6@gmail.com (Nội Thất Space Store)</option>
              </optgroup>

              <optgroup label="🛒 Khách mua hàng (Member)">
                <option value="customer@gmail.com|Member123!">customer@gmail.com (Nguyễn Văn Khách)</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="text-center text-sm text-slate-600 mt-4">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
