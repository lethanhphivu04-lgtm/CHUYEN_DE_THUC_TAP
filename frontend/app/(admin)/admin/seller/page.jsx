'use client';

import React, { useState, useEffect } from 'react';
import { sellerService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function AdminSellerPage() {
  const [sellers, setSellers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' | 'withdrawals'
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sellersData, withdrawalsData] = await Promise.all([
        sellerService.getAllSellers(statusFilter),
        sellerService.getAllWithdrawals()
      ]);
      setSellers(sellersData);
      setWithdrawals(withdrawalsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt mở gian hàng này?')) return;
    try {
      await sellerService.approveSeller(id);
      alert('Duyệt gian hàng thành công!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể duyệt gian hàng.');
    }
  };

  const handleRejectSeller = async (id) => {
    const reason = prompt('Nhập lý do từ chối/khóa shop (tùy chọn):');
    if (reason === null) return;
    try {
      await sellerService.rejectSeller(id, reason);
      alert('Đã từ chối/khóa gian hàng.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể từ chối gian hàng.');
    }
  };

  const handleProcessWithdrawal = async (id, isApproved) => {
    const note = prompt(isApproved ? 'Nhập ghi chú chuyển tiền thành công:' : 'Nhập lý do từ chối lệnh rút tiền:');
    if (note === null) return;

    try {
      await sellerService.processWithdrawal(id, isApproved, note);
      alert(isApproved ? 'Đã duyệt lệnh rút tiền thành công!' : 'Đã từ chối lệnh rút tiền.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý lệnh rút tiền.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Người Bán & Rút Tiền</h1>
          <p className="text-sm text-slate-500">Phê duyệt shop đăng ký mới và duyệt yêu cầu rút tiền từ Ví người bán.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'sellers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🏪 Danh Sách Gian Hàng ({sellers.length})
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'withdrawals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💸 Yêu Cầu Rút Tiền ({withdrawals.filter(w => w.status === 'Pending').length} chờ duyệt)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : activeTab === 'sellers' ? (
        /* TAB 1: SELLERS LIST */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center">
            <div className="text-xs font-semibold text-slate-500">Lọc theo trạng thái:</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả gian hàng</option>
              <option value="Approved">Đã duyệt (Active)</option>
              <option value="PendingApproval">Chờ duyệt</option>
              <option value="Rejected">Từ chối / Khóa</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-semibold">
                  <th className="pb-3">ID / Shop</th>
                  <th className="pb-3">Chủ sở hữu (User)</th>
                  <th className="pb-3">Ngày tạo</th>
                  <th className="pb-3">Số dư ví</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Không tìm thấy gian hàng nào.</td>
                  </tr>
                ) : (
                  sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{s.shopName}</div>
                        <div className="text-[11px] text-slate-400">ID: #{s.id}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-800">{s.userFullName || '—'}</div>
                        <div className="text-[11px] text-slate-400">{s.userEmail}</div>
                      </td>
                      <td className="py-3 text-slate-600">
                        {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 font-bold text-emerald-600">
                        {formatPrice(s.balance)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'PendingApproval' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.status === 'Approved' ? 'Đã duyệt' : s.status === 'PendingApproval' ? 'Chờ duyệt' : 'Từ chối'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        {s.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveSeller(s.id)}
                            className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[11px] hover:bg-emerald-700 transition-all cursor-pointer"
                          >
                            Duyệt Shop
                          </button>
                        )}
                        {s.status !== 'Rejected' && (
                          <button
                            onClick={() => handleRejectSeller(s.id)}
                            className="bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-lg text-[11px] hover:bg-rose-100 transition-all cursor-pointer border border-rose-200"
                          >
                            Từ Chối / Khóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: WITHDRAWALS LIST */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-semibold">
                  <th className="pb-3">ID / Shop</th>
                  <th className="pb-3">Số tiền rút</th>
                  <th className="pb-3">Thông tin chuyển khoản</th>
                  <th className="pb-3">Thời gian</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Chưa có yêu cầu rút tiền nào.</td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{w.shopName}</div>
                        <div className="text-[11px] text-slate-400">Mã YC: #{w.id}</div>
                      </td>
                      <td className="py-3 font-extrabold text-indigo-600 text-sm">
                        {formatPrice(w.amount)}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-slate-800">{w.bankName}</div>
                        <div className="text-slate-600 font-mono text-[11px]">STK: {w.accountNumber}</div>
                        <div className="text-slate-500 text-[11px]">Chủ TK: {w.accountHolder}</div>
                      </td>
                      <td className="py-3 text-slate-600">
                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          w.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {w.status === 'Pending' ? 'Chờ xử lý' : w.status === 'Approved' ? 'Đã chuyển tiền' : 'Từ chối'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        {w.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, true)}
                              className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[11px] hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                              Duyệt Chuyển Tiền
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(w.id, false)}
                              className="bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-lg text-[11px] hover:bg-rose-100 transition-all cursor-pointer border border-rose-200"
                            >
                              Từ Chối
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
