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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, text: '', color: 'bg-slate-200', textColor: 'text-slate-400' });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, text: '', color: 'bg-slate-200', textColor: 'text-slate-400' });
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    let text = '';
    let color = '';
    let textColor = '';

    if (score <= 2) {
      text = 'Yếu 🔴';
      color = 'bg-red-500';
      textColor = 'text-red-500';
    } else if (score <= 4) {
      text = 'Trung bình 🟡';
      color = 'bg-amber-500';
      textColor = 'text-amber-500';
    } else {
      text = 'Mạnh 🟢';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-500';
    }

    setStrength({ score, text, color, textColor });
  }, [password]);

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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pr-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer z-10"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">ĐỘ MẠNH MẬT KHẨU</span>
                    <span className={strength.textColor}>{strength.text}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 h-1">
                    <div className={`rounded-full h-full transition-colors ${password.length >= 6 ? (strength.score <= 2 ? 'bg-red-500' : strength.score <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`}></div>
                    <div className={`rounded-full h-full transition-colors ${strength.score >= 3 ? (strength.score <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`}></div>
                    <div className={`rounded-full h-full transition-colors ${strength.score >= 5 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-0.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pr-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer z-10"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-1 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400">XÁC MINH</span>
                  {password === confirmPassword ? (
                    <span className="text-emerald-500">Mật khẩu khớp ✓</span>
                  ) : (
                    <span className="text-red-500">Mật khẩu chưa khớp ✗</span>
                  )}
                </div>
              )}
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
