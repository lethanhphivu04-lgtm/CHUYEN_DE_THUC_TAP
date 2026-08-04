'use client';

import React, { useState, useEffect } from 'react';
import { sellerService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export default function AdminSellerPage() {
  const [sellers, setSellers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' | 'withdrawals'
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom Modal States
  const [sellerModal, setSellerModal] = useState({ isOpen: false, type: '', seller: null, reason: '' });
  const [withdrawalModal, setWithdrawalModal] = useState({ isOpen: false, isApproved: true, request: null, note: '' });

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
      setSellers(sellersData || []);
      setWithdrawals(withdrawalsData || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu người bán/rút tiền:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Seller Actions ---
  const openSellerModal = (seller, type) => {
    setSellerModal({ isOpen: true, type, seller, reason: '' });
  };

  const closeSellerModal = () => {
    setSellerModal({ isOpen: false, type: '', seller: null, reason: '' });
  };

  const handleSellerApproveConfirm = async () => {
    const { seller } = sellerModal;
    if (!seller) return;
    try {
      await sellerService.approveSeller(seller.id);
      alert('Duyệt mở gian hàng thành công!');
      closeSellerModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể duyệt gian hàng.');
    }
  };

  const handleSellerRejectConfirm = async () => {
    const { seller, reason } = sellerModal;
    if (!seller || !reason.trim()) return;
    try {
      await sellerService.rejectSeller(seller.id, reason.trim());
      alert('Đã khóa/từ chối gian hàng thành công.');
      closeSellerModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể từ chối gian hàng.');
    }
  };

  // --- Withdrawal Actions ---
  const openWithdrawalModal = (request, isApproved) => {
    setWithdrawalModal({ isOpen: true, isApproved, request, note: '' });
  };

  const closeWithdrawalModal = () => {
    setWithdrawalModal({ isOpen: false, isApproved: true, request: null, note: '' });
  };

  const handleWithdrawalConfirm = async () => {
    const { request, isApproved, note } = withdrawalModal;
    if (!request || !note.trim()) return;
    try {
      await sellerService.processWithdrawal(request.id, isApproved, note.trim());
      alert(isApproved ? 'Đã duyệt lệnh rút tiền thành công!' : 'Đã từ chối lệnh rút tiền.');
      closeWithdrawalModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý lệnh rút tiền.');
    }
  };

  // Search filter (client-side)
  const filteredSellers = sellers.filter(s => {
    const query = searchQuery.toLowerCase();
    return (
      s.shopName?.toLowerCase().includes(query) ||
      s.userFullName?.toLowerCase().includes(query) ||
      s.userEmail?.toLowerCase().includes(query) ||
      s.id?.toString().includes(query)
    );
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    const query = searchQuery.toLowerCase();
    return (
      w.shopName?.toLowerCase().includes(query) ||
      w.id?.toString().includes(query) ||
      w.bankName?.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const totalApprovedSellers = sellers.filter(s => s.status === 'Approved').length;
  const pendingSellersCount = sellers.filter(s => s.status === 'PendingApproval').length;
  const totalSystemBalance = sellers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const pendingWithdrawalAmount = withdrawals
    .filter(w => w.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Người Bán & Rút Tiền</h1>
        <p className="text-sm text-slate-500 mt-1">
          Duyệt mở gian hàng mới, quản lý trạng thái các shop và phê duyệt các giao dịch rút tiền từ ví Seller.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng Shop Đang Hoạt Động</span>
          <div className="text-2xl font-extrabold text-slate-900">{totalApprovedSellers} shop</div>
          <p className="text-[10px] text-slate-500">Trên tổng số {sellers.length} đăng ký</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm space-y-1">
          <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Yêu Cầu Chờ Duyệt Shop</span>
          <div className="text-2xl font-extrabold text-amber-600">{pendingSellersCount} yêu cầu</div>
          <p className="text-[10px] text-slate-500">Cần admin phê duyệt để bán hàng</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng Số Dư Ví Seller</span>
          <div className="text-2xl font-extrabold text-emerald-600">{formatPrice(totalSystemBalance)}</div>
          <p className="text-[10px] text-slate-500">Tiền khả dụng trong ví các người bán</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-sm space-y-1">
          <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider font-medium">Yêu Cầu Rút Tiền Chờ Duyệt</span>
          <div className="text-2xl font-extrabold text-indigo-600">{formatPrice(pendingWithdrawalAmount)}</div>
          <p className="text-[10px] text-slate-500">{withdrawals.filter(w => w.status === 'Pending').length} lệnh rút đang chờ chuyển tiền</p>
        </div>
      </div>

      {/* Filter and Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex space-x-4 w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('sellers'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'sellers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            🏪 Gian Hàng ({sellers.length})
          </button>
          <button
            onClick={() => { setActiveTab('withdrawals'); setSearchQuery(''); }}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            💸 Rút Tiền ({withdrawals.filter(w => w.status === 'Pending').length} chờ duyệt)
          </button>
        </div>

        {/* Search & Filter Inputs */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-3">
          <input
            type="text"
            placeholder={activeTab === 'sellers' ? "Tìm theo tên shop, chủ sở hữu..." : "Tìm theo tên shop, mã rút..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {activeTab === 'sellers' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Approved">Đã duyệt (Active)</option>
              <option value="PendingApproval">Chờ duyệt</option>
              <option value="Rejected">Từ chối / Khóa</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Lists Section */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex justify-center items-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : activeTab === 'sellers' ? (
        /* TAB 1: SELLERS LIST */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                  <th className="py-4 px-5">ID / Tên Shop</th>
                  <th className="py-4 px-5">Chủ sở hữu (User)</th>
                  <th className="py-4 px-5">Ngày tham gia</th>
                  <th className="py-4 px-5">Số dư ví</th>
                  <th className="py-4 px-5">Trạng thái</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Không tìm thấy gian hàng nào thỏa mãn.</td>
                  </tr>
                ) : (
                  filteredSellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{s.shopName}</div>
                        <div className="text-xs font-mono text-slate-400">ID: #{s.id}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900">{s.userFullName || '—'}</div>
                        <div className="text-xs text-slate-500">{s.userEmail}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-5 font-bold text-emerald-600">
                        {formatPrice(s.balance)}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s.status === 'PendingApproval' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {s.status === 'Approved' ? 'Đang hoạt động' : s.status === 'PendingApproval' ? 'Chờ duyệt' : 'Đã khóa/Từ chối'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        {s.status !== 'Approved' && (
                          <button
                            onClick={() => openSellerModal(s, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Duyệt mở
                          </button>
                        )}
                        {s.status !== 'Rejected' && (
                          <button
                            onClick={() => openSellerModal(s, 'reject')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors border border-rose-200 cursor-pointer"
                          >
                            Từ chối / Khóa
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                  <th className="py-4 px-5">ID / Shop</th>
                  <th className="py-4 px-5">Số tiền rút</th>
                  <th className="py-4 px-5">Thông tin thụ hưởng</th>
                  <th className="py-4 px-5">Thời gian</th>
                  <th className="py-4 px-5">Trạng thái</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Chưa có yêu cầu rút tiền nào.</td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{w.shopName}</div>
                        <div className="text-xs font-mono text-slate-400">Yêu cầu ID: #{w.id}</div>
                      </td>
                      <td className="py-4 px-5 font-extrabold text-indigo-600 text-base">
                        {formatPrice(w.amount)}
                      </td>
                      <td className="py-4 px-5 space-y-0.5">
                        <div className="font-bold text-slate-800">{w.bankName}</div>
                        <div className="text-slate-600 font-mono text-xs">STK: {w.accountNumber}</div>
                        <div className="text-slate-500 text-xs">Tên: {w.accountHolder}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          w.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          w.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {w.status === 'Pending' ? 'Chờ xử lý' : w.status === 'Approved' ? 'Chuyển tiền thành công' : 'Đã từ chối'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        {w.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => openWithdrawalModal(w, true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Duyệt chuyển
                            </button>
                            <button
                              onClick={() => openWithdrawalModal(w, false)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors border border-rose-200 cursor-pointer"
                            >
                              Từ chối
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

      {/* --- Seller Action Modal --- */}
      {sellerModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {sellerModal.type === 'approve' ? 'Xác Nhận Duyệt Mở Shop' : 'Xác Nhận Khóa / Từ Chối Shop'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gian hàng: <span className="font-bold text-slate-800">{sellerModal.seller?.shopName}</span>
              </p>
            </div>

            {sellerModal.type === 'reject' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Lý do từ chối / khóa shop <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={sellerModal.reason}
                  onChange={(e) => setSellerModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Bạn có chắc chắn muốn kích hoạt và duyệt mở gian hàng này để họ có thể đăng bán sản phẩm trên sàn?
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeSellerModal}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={sellerModal.type === 'approve' ? handleSellerApproveConfirm : handleSellerRejectConfirm}
                disabled={sellerModal.type === 'reject' && !sellerModal.reason.trim()}
                className={`px-4 py-2 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer ${
                  sellerModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Withdrawal Action Modal --- */}
      {withdrawalModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {withdrawalModal.isApproved ? 'Xác Nhận Đã Chuyển Tiền Rút' : 'Xác Nhận Từ Chối Rút Tiền'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Yêu cầu rút tiền từ ví shop: <span className="font-bold text-slate-800">{withdrawalModal.request?.shopName}</span>
                <br />
                Số tiền: <span className="font-extrabold text-indigo-600">{formatPrice(withdrawalModal.request?.amount)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">
                {withdrawalModal.isApproved ? 'Ghi chú giao dịch (Mã tham chiếu chuyển khoản...)' : 'Lý do từ chối'} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={withdrawalModal.note}
                onChange={(e) => setWithdrawalModal(prev => ({ ...prev, note: e.target.value }))}
                placeholder={withdrawalModal.isApproved ? "Nhập mã giao dịch chuyển tiền ngân hàng..." : "Nhập lý do từ chối lệnh..."}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeWithdrawalModal}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleWithdrawalConfirm}
                disabled={!withdrawalModal.note.trim()}
                className={`px-4 py-2 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer ${
                  withdrawalModal.isApproved
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300'
                } disabled:cursor-not-allowed`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
