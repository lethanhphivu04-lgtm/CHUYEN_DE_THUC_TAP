import React from 'react';
import Link from 'next/link';

export default function UserListPage() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">Quản Lý Người Dùng</h1>
        <Link
          href="/admin/user/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Thêm Người Dùng
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Họ Tên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Vai Trò</th>
              <th className="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-600">
            <tr>
              <td className="p-3 font-mono">1</td>
              <td className="p-3 font-medium text-slate-900">Lê Thanh Phi Vũ</td>
              <td className="p-3">admin@marketplace.vn</td>
              <td className="p-3"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Admin</span></td>
              <td className="p-3 text-right space-x-2">
                <Link href="/admin/user/1/show" className="text-indigo-600 hover:underline text-xs">Xem</Link>
                <Link href="/admin/user/1/edit" className="text-amber-600 hover:underline text-xs">Sửa</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
