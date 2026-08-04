'use client';

import React, { useState, useEffect } from 'react';
import { voucherService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'amount'
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '',
    discountAmount: '',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '100',
    startDate: '',
    expiryDate: '',
    isActive: true
  });

  // Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      // Endpoint retrieves active active vouchers, but to see all vouchers, we fetch the active list.
      // If we want to see admin-created ones, getActiveVouchers returns all active / recently created ones.
      const data = await voucherService.getActiveVouchers();
      if (data) {
        setVouchers(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải mã giảm giá:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateModal = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    // Formatted for datetime-local input (YYYY-MM-DDThh:mm)
    const formatDate = (date) => {
      const pad = (num) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`;
    };

    setFormData({
      code: '',
      discountPercent: '',
      discountAmount: '',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      usageLimit: '100',
      startDate: formatDate(today),
      expiryDate: formatDate(nextMonth),
      isActive: true
    });
    setDiscountType('percent');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Vui lòng điền mã giảm giá.');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
      usageLimit: parseInt(formData.usageLimit) || 100,
      usedCount: 0,
      startDate: new Date(formData.startDate).toISOString(),
      expiryDate: new Date(formData.expiryDate).toISOString(),
      isActive: formData.isActive
    };

    if (discountType === 'percent') {
      payload.discountPercent = parseFloat(formData.discountPercent);
      payload.discountAmount = null;
      if (formData.maxDiscountAmount) {
        payload.maxDiscountAmount = parseFloat(formData.maxDiscountAmount);
      } else {
        payload.maxDiscountAmount = null;
      }
    } else {
      payload.discountAmount = parseFloat(formData.discountAmount);
      payload.discountPercent = null;
      payload.maxDiscountAmount = null;
    }

    try {
      await voucherService.createVoucher(payload);
      alert('Tạo mã giảm giá thành công!');
      setIsCreateModalOpen(false);
      fetchVouchers();
    } catch (err) {
      console.error('Lỗi khi tạo mã giảm giá:', err);
      alert(err.response?.data?.message || 'Không thể tạo mã giảm giá. Vui lòng kiểm tra lại.');
    }
  };

  const openDeleteModal = (voucher) => {
    setVoucherToDelete(voucher);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setVoucherToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;
    try {
      await voucherService.deleteVoucher(voucherToDelete.id);
      alert('Đã xóa mã giảm giá thành công.');
      closeDeleteModal();
      fetchVouchers();
    } catch (err) {
      console.error('Lỗi khi xóa mã giảm giá:', err);
      alert(err.response?.data?.message || 'Không thể xóa mã giảm giá.');
    }
  };

  // Client-side search
  const filteredVouchers = vouchers.filter(v =>
    v.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Mã Giảm Giá</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo, theo dõi hạn dùng và cấu hình mã giảm giá (Voucher) áp dụng cho toàn bộ đơn hàng trên sàn.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Tạo Mã Giảm Giá
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã giảm giá (VD: STUDENT10)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchVouchers}
          className="text-xs text-slate-500 font-semibold hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Làm mới ↻
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách voucher...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            Chưa có mã giảm giá nào hoạt động hoặc được tìm thấy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                  <th className="py-4 px-5">Mã Code</th>
                  <th className="py-4 px-5">Mức Giảm</th>
                  <th className="py-4 px-5">Đơn Tối Thiểu</th>
                  <th className="py-4 px-5">Giới Hạn Sử Dụng</th>
                  <th className="py-4 px-5">Hạn Sử Dụng</th>
                  <th className="py-4 px-5">Trạng Thái</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => {
                  const now = new Date();
                  const isExpired = new Date(v.expiryDate) < now;
                  const isOutLimit = v.usedCount >= v.usageLimit;
                  const isVoucherActive = v.isActive && !isExpired && !isOutLimit;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-lg">
                          {v.code}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-900">
                        {v.discountPercent ? (
                          <span className="text-indigo-600">{v.discountPercent}%</span>
                        ) : (
                          <span className="text-emerald-600">{formatPrice(v.discountAmount)}</span>
                        )}
                        {v.maxDiscountAmount && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Giảm tối đa: {formatPrice(v.maxDiscountAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">
                        {formatPrice(v.minOrderAmount)}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">
                          {v.usedCount} / {v.usageLimit}
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500">
                        <div>BĐ: {new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                        <div>KT: {new Date(v.expiryDate).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isVoucherActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isVoucherActive 
                            ? 'Đang hoạt động' 
                            : isExpired 
                              ? 'Hết hạn' 
                              : isOutLimit 
                                ? 'Hết lượt dùng' 
                                : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => openDeleteModal(v)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Xóa mã
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Create Voucher Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tạo Mã Giảm Giá Mới</h3>
              <p className="text-xs text-slate-500 mt-1">Cấu hình thông số voucher áp dụng toàn sàn.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="block font-semibold text-slate-600 uppercase">Mã giảm giá *</label>
                  <input
                    type="text"
                    required
                    name="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="VD: STUDENT10, HELLO2026..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="block font-semibold text-slate-600 uppercase">Loại giảm giá</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={discountType === 'percent'}
                        onChange={() => setDiscountType('percent')}
                      />
                      Giảm theo Phần trăm (%)
                    </label>
                    <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={discountType === 'amount'}
                        onChange={() => setDiscountType('amount')}
                      />
                      Giảm số tiền cụ thể (VND)
                    </label>
                  </div>
                </div>

                {discountType === 'percent' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-600 uppercase">Phần trăm giảm (%) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        name="discountPercent"
                        value={formData.discountPercent}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: 10, 15..."
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-600 uppercase">Số tiền giảm tối đa (VND)</label>
                      <input
                        type="number"
                        min="0"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        placeholder="Không bắt buộc..."
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 col-span-2">
                    <label className="block font-semibold text-slate-600 uppercase">Số tiền giảm (VND) *</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      name="discountAmount"
                      value={formData.discountAmount}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: 20000, 50000..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-600 uppercase">Đơn tối thiểu (VND)</label>
                  <input
                    type="number"
                    min="0"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-600 uppercase">Số lần dùng tối đa</label>
                  <input
                    type="number"
                    required
                    min="1"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-600 uppercase">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    required
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-600 uppercase">Ngày hết hạn</label>
                  <input
                    type="datetime-local"
                    required
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="font-semibold text-slate-700 select-none cursor-pointer">
                    Kích hoạt hoạt động ngay khi tạo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Tạo Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirm Modal --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Xác Nhận Xóa Mã Giảm Giá</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá <span className="font-mono font-bold text-indigo-600">{voucherToDelete?.code}</span>? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
