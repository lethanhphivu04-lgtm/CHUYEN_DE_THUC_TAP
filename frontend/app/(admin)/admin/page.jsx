import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Quản Trị Hệ Thống</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Tổng Gian Hàng</span>
          <div className="text-2xl font-bold text-slate-900">24</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Tổng Người Dùng</span>
          <div className="text-2xl font-bold text-indigo-600">1,280</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Đơn Hàng Hôm Nay</span>
          <div className="text-2xl font-bold text-emerald-600">156</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Doanh Thu Sàn</span>
          <div className="text-2xl font-bold text-amber-600">45.8M VNĐ</div>
        </div>
      </div>
    </div>
  );
}
