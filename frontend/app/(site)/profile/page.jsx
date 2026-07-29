'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '../_lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getMe();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('Không thể tải thông tin hồ sơ.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
        <p className="text-sm text-slate-500 mt-1">Thông tin chi tiết về tài khoản HITU MARKET của bạn.</p>
      </div>

      <hr className="border-slate-200" />

      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Họ và tên</span>
          <span className="mt-1 block text-base font-medium text-slate-900">{profile.fullName}</span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Địa chỉ Email</span>
          <span className="mt-1 block text-base font-medium text-slate-900">{profile.email}</span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Vai trò</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.roles && profile.roles.map((role) => (
              <span 
                key={role}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  role === 'Admin' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : role === 'Seller' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-800'
                }`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài khoản bán hàng</span>
          <span className="mt-1 block text-base font-medium text-slate-900">
            {profile.isSeller ? 'Đã kích hoạt' : 'Chưa đăng ký bán hàng'}
          </span>
        </div>
      </div>
    </div>
  );
}
