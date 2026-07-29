import React from 'react';
import Link from 'next/link';

export default async function ShowUserPage({ params }) {
  const { id } = await params;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-bold text-slate-900">Chi Tiết Người Dùng #{id}</h1>
        <Link href="/admin/user" className="text-sm text-slate-500 hover:text-slate-700">← Quay lại</Link>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-slate-500 block text-xs">Họ và tên:</span>
          <span className="font-semibold text-slate-900 text-base">Lê Thanh Phi Vũ</span>
        </div>
        <div>
          <span className="text-slate-500 block text-xs">Email:</span>
          <span className="font-medium text-slate-800">admin@marketplace.vn</span>
        </div>
        <div>
          <span className="text-slate-500 block text-xs">Vai trò:</span>
          <span className="inline-block bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded text-xs">Admin</span>
        </div>
      </div>
    </div>
  );
}
