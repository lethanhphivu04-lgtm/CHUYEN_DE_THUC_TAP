'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminDashboardService } from '../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await adminDashboardService.getStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Quản Trị Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Thống kê tổng quan thời gian thực toàn bộ hoạt động sàn thương mại điện tử HITU MARKET.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : null}
          Làm mới dữ liệu
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-slate-500 font-medium">Đang cập nhật số liệu thời gian thực...</p>
        </div>
      ) : (
        <>
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Doanh Thu Giao Thành Công
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {formatPrice(stats?.totalRevenue)}
              </div>
              <p className="text-xs text-slate-500">Tổng doanh thu các đơn hàng hoàn tất</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Tổng Người Dùng
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-slate-500">Tài khoản thành viên & Admin hệ thống</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Gian Hàng Hoạt Động
                </span>
                {stats?.pendingSellers > 0 && (
                  <Link
                    href="/admin/seller"
                    className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                  >
                    {stats.pendingSellers} chờ duyệt
                  </Link>
                )}
              </div>
              <div className="text-2xl font-extrabold text-purple-600 tracking-tight">
                {stats?.totalSellers || 0}
              </div>
              <p className="text-xs text-slate-500">Shop hợp lệ trên toàn sàn</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Tổng Đơn Hàng & Sản Phẩm
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                  {stats?.totalOrders || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  đơn / {stats?.totalProducts || 0} sản phẩm
                </span>
              </div>
              <p className="text-xs text-slate-500">Tất cả giao dịch trên hệ thống</p>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Đơn Hàng Gần Đây</h2>
                <p className="text-xs text-slate-500">5 giao dịch mới nhất trên hệ thống</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-400 uppercase text-xs font-semibold">
                    <th className="pb-3.5">Mã Đơn</th>
                    <th className="pb-3.5">Khách Hàng</th>
                    <th className="pb-3.5">Thanh Toán</th>
                    <th className="pb-3.5">Thời Gian</th>
                    <th className="pb-3.5 text-right">Tổng Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Chưa có đơn hàng nào phát sinh.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 font-mono font-bold text-indigo-600">#{o.id}</td>
                        <td className="py-4 font-semibold text-slate-900">{o.customerName || '—'}</td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              o.paymentMethod === 'VNPAY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500 text-xs">
                          {new Date(o.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-4 text-right font-extrabold text-slate-900">
                          {formatPrice(o.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/admin/user"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm transition-all group"
            >
              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                👥 Quản lý Người dùng →
              </div>
              <p className="text-xs text-slate-500 mt-1">Khóa tài khoản, phân vai trò</p>
            </Link>
            <Link
              href="/admin/seller"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm transition-all group"
            >
              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                🏪 Quản lý Gian hàng →
              </div>
              <p className="text-xs text-slate-500 mt-1">Duyệt shop mới, duyệt rút tiền</p>
            </Link>
            <Link
              href="/admin/category"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm transition-all group"
            >
              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                📂 Quản lý Danh mục →
              </div>
              <p className="text-xs text-slate-500 mt-1">Cây danh mục sản phẩm</p>
            </Link>
            <Link
              href="/admin/product"
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm transition-all group"
            >
              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                📦 Quản lý Sản phẩm →
              </div>
              <p className="text-xs text-slate-500 mt-1">Duyệt và kiểm soát sản phẩm</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
