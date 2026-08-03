'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function VnPayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const processReturn = async () => {
      const queryString = typeof window !== 'undefined' ? window.location.search : '';
      if (!queryString) {
        setLoading(false);
        return;
      }

      try {
        const data = await paymentService.processVnPayReturn(queryString);
        setResult(data);
      } catch (err) {
        console.error(err);
        setResult({
          success: false,
          message: err.response?.data?.message || 'Có lỗi xảy ra khi xác thực giao dịch thanh toán.'
        });
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold text-slate-600">Đang xác thực kết quả thanh toán từ VNPay...</p>
      </div>
    );
  }

  const isSuccess = result?.success;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        
        {/* Status Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
              ✓
            </div>
          ) : (
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
              ✕
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className={`text-2xl font-bold ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isSuccess ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {result?.message}
          </p>
        </div>

        {/* Details Table */}
        <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2.5 border border-slate-100 text-left">
          {result?.orderId && (
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Mã đơn hàng</span>
              <span className="font-bold text-slate-800">#{result.orderId}</span>
            </div>
          )}
          {result?.vnPayTransactionNo && (
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Mã giao dịch VNPay</span>
              <span className="font-mono font-bold text-slate-800">{result.vnPayTransactionNo}</span>
            </div>
          )}
          {result?.txnRef && (
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Mã tham chiếu (TxnRef)</span>
              <span className="font-mono text-slate-700">{result.txnRef}</span>
            </div>
          )}
          {result?.responseCode && (
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Mã phản hồi (Response Code)</span>
              <span className="font-mono font-bold text-slate-800">{result.responseCode}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/profile/orders"
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-indigo-700 transition-all text-center"
          >
            Quản Lý Đơn Hàng
          </Link>
          <Link
            href="/"
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl text-sm hover:bg-slate-200 transition-all text-center border border-slate-200"
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
