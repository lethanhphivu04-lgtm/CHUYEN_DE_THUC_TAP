import React from 'react';
import Link from 'next/link';

export default async function EditUserPage({ params }) {
  const { id } = await params;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-xl font-bold text-slate-900">Chỉnh Sửa Người Dùng #{id}</h1>
        <Link href="/admin/user" className="text-sm text-slate-500 hover:text-slate-700">← Quay lại</Link>
      </div>

      <form className="space-y-4 text-sm">
        <div>
          <label className="block font-medium mb-1">Họ và tên</label>
          <input type="text" defaultValue="Lê Thanh Phi Vũ" className="w-full border rounded-lg p-2.5 outline-indigo-500" />
        </div>
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input type="email" defaultValue="admin@marketplace.vn" className="w-full border rounded-lg p-2.5 outline-indigo-500" />
        </div>
        <div>
          <label className="block font-medium mb-1">Vai trò</label>
          <select defaultValue="Admin" className="w-full border rounded-lg p-2.5 outline-indigo-500 bg-white">
            <option value="Member">Member (Khách mua)</option>
            <option value="Seller">Seller (Người bán)</option>
            <option value="Admin">Admin (Quản trị)</option>
          </select>
        </div>
        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
          Cập Nhật Người Dùng
        </button>
      </form>
    </div>
  );
}
