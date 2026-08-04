'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminUserService } from '../../../_lib/api';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const data = await adminUserService.getUsers(query);
      setUsers(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleToggleLock = async (user) => {
    const actionText = user.isLocked ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản ${user.email}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminUserService.toggleLock(user.id);
      alert(res.message || `Đã ${actionText} tài khoản thành công.`);
      await fetchUsers(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái khóa.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    const currentRole = user.roles && user.roles.length > 0 ? user.roles[0] : '';
    if (newRole === currentRole) return;

    if (!confirm(`Bạn có chắc muốn đổi vai trò của ${user.email} sang "${newRole}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminUserService.assignRole(user.id, newRole);
      alert(res.message || `Đã gán vai trò ${newRole} cho người dùng.`);
      await fetchUsers(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi vai trò.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Seller':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Member':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Người Dùng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tài khoản hệ thống, khóa/mở khóa tài khoản và phân quyền vai trò.
          </p>
        </div>
        <Link
          href="/admin/user/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Thêm Người Dùng
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-96 gap-2">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors shrink-0"
          >
            Tìm kiếm
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchUsers('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3 py-2 rounded-xl text-sm transition-colors"
            >
              Xóa
            </button>
          )}
        </form>

        <div className="text-sm font-medium text-slate-500">
          Tổng số: <span className="text-slate-900 font-bold">{users.length}</span> người dùng
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-slate-500">Đang tải danh sách người dùng...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-xs font-semibold">
                  <th className="pb-3.5">Người dùng</th>
                  <th className="pb-3.5">Số điện thoại</th>
                  <th className="pb-3.5">Ngày đăng ký</th>
                  <th className="pb-3.5">Trạng thái</th>
                  <th className="pb-3.5">Vai trò</th>
                  <th className="pb-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const currentRole = u.roles && u.roles.length > 0 ? u.roles[0] : 'Member';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-slate-900">{u.fullName || '—'}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="py-4 text-slate-600 font-mono text-xs">
                          {u.phoneNumber || 'Chưa cập nhật'}
                        </td>
                        <td className="py-4 text-slate-600 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              u.isLocked
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isLocked ? 'bg-rose-600' : 'bg-emerald-600'
                              }`}
                            />
                            {u.isLocked ? 'Đã Khóa' : 'Hoạt Động'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRoleBadgeStyle(
                                currentRole
                              )}`}
                            >
                              {currentRole}
                            </span>
                            <select
                              value={currentRole}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              disabled={actionLoading}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Seller">Seller</option>
                              <option value="Member">Member</option>
                              <option value="Guest">Guest</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleLock(u)}
                            disabled={actionLoading}
                            className={`font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                              u.isLocked
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {u.isLocked ? 'Mở Khóa' : 'Khóa TK'}
                          </button>
                          <Link
                            href={`/admin/user/${u.id}/show`}
                            className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            Chi Tiết
                          </Link>
                          <Link
                            href={`/admin/user/${u.id}/edit`}
                            className="inline-block bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            Sửa
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
