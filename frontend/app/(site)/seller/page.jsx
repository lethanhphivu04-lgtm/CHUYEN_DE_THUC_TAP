'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, sellerService } from '../../_lib/api';

export default function SellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'not_logged_in' | 'no_shop' | 'PendingApproval' | 'Approved' | 'Rejected'
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    const checkSellerStatus = async () => {
      const user = authService.getCurrentUser();
      if (!user) {
        setStatus('not_logged_in');
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const shop = await sellerService.getMyShop();
        if (shop) {
          setShopName(shop.shopName);
          setStatus(shop.status);
          if (shop.status === 'Approved') {
            router.push('/seller/dashboard');
          }
        } else {
          setStatus('no_shop');
          router.push('/seller/register');
        }
      } catch (err) {
        setStatus('no_shop');
        router.push('/seller/register');
      } finally {
        setLoading(false);
      }
    };

    checkSellerStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-slate-500 font-medium">Đang kiểm tra thông tin gian hàng...</p>
      </div>
    );
  }

  if (status === 'PendingApproval') {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5 transition-all hover:shadow-2xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold animate-pulse">
            ⏳
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Gian Hàng Chờ Phê Duyệt</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gian hàng <strong className="text-slate-900">"{shopName}"</strong> của bạn đã đăng ký thành công và đang được Admin xem xét phê duyệt.
          </p>
          <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
            Trạng thái: Đang chờ duyệt
          </div>
          <p className="text-xs text-slate-400">
            Chúng tôi thường duyệt gian hàng trong vòng 24 giờ làm việc. Vui lòng quay lại sau!
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
            >
              Quay lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Rejected') {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5 transition-all hover:shadow-2xl">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
            🚫
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Yêu Cầu Bị Từ Chối / Đã Khóa</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gian hàng <strong className="text-slate-900">"{shopName}"</strong> của bạn đã bị từ chối phê duyệt hoặc đang tạm khóa do vi phạm chính sách của sàn.
          </p>
          <div className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
            Trạng thái: Từ chối / Tạm khóa
          </div>
          <p className="text-xs text-slate-400">
            Vui lòng liên hệ với bộ phận hỗ trợ của HITU MARKET qua email admin để giải quyết khiếu nại.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
            >
              Quay lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
