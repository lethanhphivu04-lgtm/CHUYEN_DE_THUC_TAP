import React from 'react';
import Link from 'next/link';

export default function AddUserPage() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-bold text-slate-900">Thêm Người Dùng Mới</h1>
        <Link href="/admin/user" className="text-sm text-slate-500 hover:text-slate-700">← Quay lại</Link>
      </div>

      <form className="space-y-4 text-sm">
        <div>
          <label className="block font-medium mb-1">Họ và tên</label>
          <input type="text" placeholder="Nhập họ và tên" className="w-full border rounded-lg p-2.5 outline-indigo-500" />
        </div>
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input type="email" placeholder="example@domain.com" className="w-full border rounded-lg p-2.5 outline-indigo-500" />
        </div>
        <div>
          <label className="block font-medium mb-1">Mật khẩu</label>
          <input type="password" placeholder="••••••••" className="w-full border rounded-lg p-2.5 outline-indigo-500" />
        </div>
        <div>
          <label className="block font-medium mb-1">Vai trò</label>
          <select className="w-full border rounded-lg p-2.5 outline-indigo-500 bg-white">
            <option value="Member">Member (Khách mua)</option>
            <option value="Seller">Seller (Người bán)</option>
            <option value="Admin">Admin (Quản trị)</option>
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
          Lưu Người Dùng
        </button>
      </form>
    </div>
  );
}
