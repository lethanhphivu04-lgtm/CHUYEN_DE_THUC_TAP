'use client';

import React, { useState, useEffect } from 'react';
import { adminOrderService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export default function AdminOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  
  // Expanded Order IDs
  const [expandedOrders, setExpandedOrders] = useState({});

  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [subOrderToCancel, setSubOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (currentSearch = search) => {
    setLoading(true);
    try {
      const data = await adminOrderService.getAllOrders(currentSearch);
      if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(search);
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const openCancelModal = (subOrder) => {
    setSubOrderToCancel(subOrder);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setSubOrderToCancel(null);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!subOrderToCancel || !cancelReason.trim()) return;

    setCancelling(true);
    try {
      await adminOrderService.cancelOrder(subOrderToCancel.id, cancelReason.trim());
      alert('Hủy đơn hàng thành công.');
      closeCancelModal();
      fetchOrders();
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err);
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  // Client-side payment method filter
  const filteredOrders = orders.filter(o => {
    if (!paymentMethodFilter) return true;
    return o.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Returned':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang chuẩn bị hàng';
      case 'Shipped': return 'Đang giao hàng';
      case 'Delivered': return 'Đã giao hàng';
      case 'Cancelled': return 'Đã hủy';
      case 'Returned': return 'Đã trả hàng/Hoàn tiền';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Đơn Hàng</h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem thông tin đơn hàng lớn (Order), theo dõi đơn hàng con (SubOrder) của từng shop và xử lý hủy đơn khẩn cấp.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full md:w-96 gap-2">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên/email khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shrink-0 cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex w-full md:w-auto items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 shrink-0">Thanh toán:</span>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Tất cả phương thức</option>
            <option value="COD">COD (Tiền mặt)</option>
            <option value="VNPay">VNPay (Thẻ/QR)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            Không tìm thấy đơn hàng nào khớp với điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
                  <th className="py-4 px-5">Mã Đơn Lớn</th>
                  <th className="py-4 px-5">Khách Hàng</th>
                  <th className="py-4 px-5">Phương Thức</th>
                  <th className="py-4 px-5">Ngày Đặt</th>
                  <th className="py-4 px-5">Đơn Con</th>
                  <th className="py-4 px-5 text-right">Tổng Tiền</th>
                  <th className="py-4 px-5 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  return (
                    <React.Fragment key={order.id}>
                      {/* Parent Row */}
                      <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                        <td className="py-4 px-5 font-mono font-bold text-indigo-600">#{order.id}</td>
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-900">{order.customerName}</div>
                          <div className="text-xs text-slate-500">{order.customerEmail}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              order.paymentMethod === 'VNPay'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-xs">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-700">
                          {order.subOrders?.length || 0} shop con
                        </td>
                        <td className="py-4 px-5 text-right font-extrabold text-slate-900">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => toggleExpandOrder(order.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-all cursor-pointer bg-white"
                          >
                            {isExpanded ? 'Ẩn chi tiết ↑' : 'Xem chi tiết ↓'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Sub-Orders Block */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/50 p-5 border-t border-b border-slate-200/50">
                            <div className="space-y-4">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Danh Sách Đơn Hàng Con (Phân Chia Theo Từng Shop)
                              </h3>
                              <div className="grid grid-cols-1 gap-4">
                                {order.subOrders?.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4"
                                  >
                                    {/* Sub-order Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                          Đơn con: <span className="font-mono text-indigo-600">#{sub.id}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          Cửa hàng: <span className="font-semibold text-slate-700">{sub.shopName || `Shop ID ${sub.sellerId}`}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(sub.status)}`}>
                                          {getStatusText(sub.status)}
                                        </span>
                                        {sub.status === 'Pending' && (
                                          <button
                                            onClick={() => openCancelModal(sub)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                          >
                                            Hủy đơn con
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Products Grid */}
                                    <div className="space-y-2">
                                      {sub.items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs">
                                          <div className="flex items-center gap-2">
                                            {item.imageUrl ? (
                                              <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="w-10 h-10 object-cover rounded border border-slate-200"
                                              />
                                            ) : (
                                              <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200" />
                                            )}
                                            <div>
                                              <div className="font-semibold text-slate-900">{item.productName}</div>
                                              {item.skuInfo && (
                                                <div className="text-slate-400 text-[10px]">{item.skuInfo}</div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-medium text-slate-900">
                                              {formatPrice(item.priceSnapshot)} x {item.quantity}
                                            </div>
                                            <div className="font-semibold text-slate-500">
                                              {formatPrice(item.priceSnapshot * item.quantity)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Sub-order Summary & Timeline */}
                                    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4 pt-3 border-t border-slate-100">
                                      {/* Status histories timeline */}
                                      <div className="flex-1 space-y-2">
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                          Timeline trạng thái
                                        </div>
                                        {sub.statusHistories && sub.statusHistories.length > 0 ? (
                                          <div className="relative pl-4 border-l border-indigo-200 space-y-3">
                                            {sub.statusHistories.map((h, i) => (
                                              <div key={i} className="relative text-xs">
                                                {/* Bullet */}
                                                <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                                                <div className="font-semibold text-slate-800">
                                                  Chuyển sang: {getStatusText(h.to)}
                                                </div>
                                                {h.note && (
                                                  <div className="text-slate-500 mt-0.5 italic">Lý do: {h.note}</div>
                                                )}
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                  {new Date(h.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-slate-400">Không có lịch sử trạng thái.</div>
                                        )}
                                      </div>

                                      {/* Subtotal */}
                                      <div className="text-right flex flex-col justify-end">
                                        <span className="text-xs text-slate-500">Tổng tiền Shop con:</span>
                                        <span className="text-base font-extrabold text-slate-900">{formatPrice(sub.subTotal)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal (Required Note) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Xác Nhận Hủy Đơn Hàng Con</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn đang thực hiện hủy đơn con <span className="font-mono font-bold text-indigo-600">#{subOrderToCancel?.id}</span>.
                Vui lòng nhập lý do cụ thể. Lý do này bắt buộc phải nhập và sẽ hiển thị công khai.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="cancel-note" className="block text-xs font-semibold text-slate-600 uppercase">
                Lý do hủy đơn hàng <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="cancel-note"
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy (ví dụ: Khách hàng yêu cầu hủy qua điện thoại, Phát hiện giao dịch đáng ngờ...)"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelling}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm disabled:scale-100 flex items-center gap-1.5"
              >
                {cancelling ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                Xác nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
