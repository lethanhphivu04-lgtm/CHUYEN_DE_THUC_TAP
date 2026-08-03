'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sellerService } from '../../../_lib/api';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [existingShop, setExistingShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkShop = async () => {
      try {
        const shop = await sellerService.getMyShop();
        setExistingShop(shop);
      } catch (err) {
        // No shop yet -> user can register
      } finally {
        setLoading(false);
      }
    };
    checkShop();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      alert('Vui lòng nhập tên gian hàng.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await sellerService.register(shopName, description, logoUrl);
      alert('Đăng ký Người bán thành công!');
      router.push('/seller/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đăng ký gian hàng.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (existingShop) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto font-bold">
            🏪
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bạn Đã Có Gian Hàng</h1>
          <p className="text-sm text-slate-600">
            Tên gian hàng: <strong className="text-slate-900">{existingShop.shopName}</strong>
          </p>
          <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            Trạng thái: {existingShop.status === 'Approved' ? 'Đã hoạt động' : existingShop.status}
          </div>
          <div className="pt-2">
            <Link
              href="/seller/dashboard"
              className="inline-block bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-all shadow-sm"
            >
              Truy Cập Seller Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Đăng Ký Mở Gian Hàng</h1>
          <p className="text-sm text-slate-500">
            Trở thành Người bán trên HITU MARKET để tiếp cận hàng triệu khách hàng mua sắm.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Tên Gian Hàng / Shop *</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="VD: Shop Thời Trang HITU"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Mô Tả Gian Hàng</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu thương hiệu, thông tin bảo hành, cam kết chất lượng..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Logo Shop (URL hình ảnh)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-indigo-700 transition-all shadow-md disabled:bg-slate-300 cursor-pointer"
          >
            {submitting ? 'Đang gửi thông tin...' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
