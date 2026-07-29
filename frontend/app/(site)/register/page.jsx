'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '../../_lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    const user = authService.getCurrentUser();
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await authService.register(email, password, fullName, isSeller);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng sang trang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      if (Array.isArray(err.response?.data)) {
        setError(err.response.data.map(e => e.description).join(', '));
      } else {
        setError(
          err.response?.data?.message || 
          'Đăng ký thất bại. Email có thể đã được đăng ký hoặc dữ liệu không hợp lệ.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Tham gia mua bán trên <span className="font-semibold text-indigo-600">HITU MARKET</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-0.5">
                Họ và Tên
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-0.5">
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
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                placeholder="ten@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-0.5">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-0.5">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bạn muốn sử dụng tài khoản để làm gì?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center text-sm font-normal text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={!isSeller}
                    onChange={() => setIsSeller(false)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 mr-2"
                  />
                  Chỉ mua sắm (Khách hàng)
                </label>
                <label className="flex items-center text-sm font-normal text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={isSeller}
                    onChange={() => setIsSeller(true)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 mr-2"
                  />
                  Mở gian hàng kinh doanh (Người bán)
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-indigo-400 disabled:scale-100 disabled:pointer-events-none"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              Đăng Ký
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-600 mt-4">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
