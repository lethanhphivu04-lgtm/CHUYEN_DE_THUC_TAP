'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { orderService, productReviewService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const STATUS_MAP = {
  Pending: { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  Processing: { label: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  Shipping: { label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  Delivered: { label: 'Đã giao hàng', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Cancelled: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  Returned: { label: 'Đã trả hàng/Hoàn tiền', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);

  // Review state variables
  const [reviewedItems, setReviewedItems] = useState({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSubOrderId, setReviewSubOrderId] = useState(null);
  const [reviewProductId, setReviewProductId] = useState(null);
  const [reviewProductName, setReviewProductName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử đơn hàng:', err);
      setError('Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (subOrderId) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    setCancelingId(subOrderId);
    try {
      await orderService.cancelSubOrder(subOrderId);
      await fetchOrders();
      if (selectedOrderDetail) {
        const updatedDetail = await orderService.getOrder(selectedOrderDetail.id);
        setSelectedOrderDetail(updatedDetail);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const detail = await orderService.getOrder(orderId);
      setSelectedOrderDetail(detail);
    } catch (err) {
      alert('Không thể xem chi tiết đơn hàng.');
    }
  };

  // Review functions
  const openReviewModal = (subOrderId, productId, productName) => {
    setReviewSubOrderId(subOrderId);
    setReviewProductId(productId);
    setReviewProductName(productName);
    setRating(5);
    setComment('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Vui lòng nhập nhận xét sản phẩm.');
      return;
    }
    setSubmittingReview(true);
    try {
      await productReviewService.createReview(reviewProductId, reviewSubOrderId, rating, comment.trim());
      alert('Gửi đánh giá thành công! Cảm ơn ý kiến của bạn.');
      setReviewedItems(prev => ({ ...prev, [`${reviewSubOrderId}_${reviewProductId}`]: true }));
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể gửi đánh giá.';
      alert(msg);
      // If already reviewed, update UI as well
      if (msg.includes('đã gửi đánh giá') || msg.includes('đã đánh giá')) {
        setReviewedItems(prev => ({ ...prev, [`${reviewSubOrderId}_${reviewProductId}`]: true }));
        setIsReviewModalOpen(false);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch Sử Đơn Hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý và theo dõi trạng thái các đơn hàng của bạn</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-slate-500 text-sm">Bạn chưa có đơn hàng nào.</p>
          <Link href="/product" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-all">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white space-y-3">
              {/* Order Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs">
                <div className="space-x-2">
                  <span className="font-bold text-slate-880">Mã đơn: #{order.id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-550">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-slate-700">Thanh toán: {order.paymentMethod}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-indigo-600 text-sm">{formatPrice(order.totalAmount)}</span>
                  <button
                    onClick={() => handleViewDetail(order.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 bg-indigo-50 px-2.5 py-1 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>

              {/* SubOrders breakdown */}
              <div className="p-4 space-y-4 divide-y divide-slate-100">
                {order.subOrders.map((subOrder) => {
                  const statusInfo = STATUS_MAP[subOrder.status] || { label: subOrder.status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  return (
                    <div key={subOrder.id} className="pt-3 first:pt-0 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">🏪 {subOrder.shopName} (Đơn con #{subOrder.id})</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {subOrder.status === 'Pending' && (
                            <button
                              onClick={() => handleCancel(subOrder.id)}
                              disabled={cancelingId === subOrder.id}
                              className="text-red-500 hover:text-red-700 font-bold text-xs border border-red-200 px-2 py-0.5 rounded hover:bg-red-50 cursor-pointer disabled:opacity-50"
                            >
                              {cancelingId === subOrder.id ? 'Đang hủy...' : 'Hủy đơn'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {subOrder.items.map((item) => (
                          <div key={item.id} className="flex gap-3 items-center">
                            <img src={item.imageUrl || 'https://via.placeholder.com/50'} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                            <div className="flex-1 text-xs space-y-0.5">
                              <div className="font-semibold text-slate-800 line-clamp-1">{item.productName}</div>
                              {item.skuInfo && <div className="text-slate-400">{item.skuInfo}</div>}
                              <div className="text-slate-500">{formatPrice(item.priceSnapshot)} x {item.quantity}</div>
                            </div>
                            <div className="font-bold text-slate-800 text-xs text-right">
                              <div>{formatPrice(item.priceSnapshot * item.quantity)}</div>
                              {subOrder.status === 'Delivered' && (
                                <div className="mt-2">
                                  {reviewedItems[`${subOrder.id}_${item.productId}`] ? (
                                    <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded">
                                      ✓ Đã đánh giá
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => openReviewModal(subOrder.id, item.productId, item.productName)}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-bold text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer"
                                    >
                                      Đánh giá
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Chi Tiết Đơn Hàng #{selectedOrderDetail.id}
              </h3>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Address Snapshot Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Địa chỉ giao hàng</div>
              {(() => {
                try {
                  const addr = JSON.parse(selectedOrderDetail.addressSnapshot);
                  return (
                    <div>
                      <p className="font-bold text-slate-800">{addr.ReceiverName} ({addr.Phone})</p>
                      <p className="text-slate-600">{addr.StreetAddress}, {addr.Ward}, {addr.District}, {addr.City}</p>
                    </div>
                  );
                } catch (e) {
                  return <p>{selectedOrderDetail.addressSnapshot}</p>;
                }
              })()}
            </div>

            {/* Timeline for each SubOrder */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Lịch sử trạng thái đơn con</h4>
              {selectedOrderDetail.subOrders.map((so) => (
                <div key={so.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">🏪 {so.shopName} (Mã đơn con #{so.id})</span>
                    <span className="font-bold text-indigo-600">{formatPrice(so.subTotal)}</span>
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-2 pl-4 border-l-2 border-indigo-200 text-xs">
                    {so.statusHistories && so.statusHistories.map((h, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                        <div className="font-semibold text-slate-800">
                          {STATUS_MAP[h.to]?.label || h.to}
                        </div>
                        {h.note && <div className="text-slate-500 italic">{h.note}</div>}
                        <div className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Review Modal --- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Đánh Giá Sản Phẩm</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sản phẩm: <span className="font-bold text-slate-800">{reviewProductName}</span>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="space-y-1.5 text-center">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Chọn số sao</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl focus:outline-none transition-all scale-100 hover:scale-110 cursor-pointer"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-bold text-amber-500 mt-1">
                  {rating === 5 ? 'Cực kỳ hài lòng' :
                   rating === 4 ? 'Hài lòng' :
                   rating === 3 ? 'Bình thường' :
                   rating === 2 ? 'Không hài lòng' : 'Rất tệ'}
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-1.5">
                <label htmlFor="review-comment" className="block text-xs font-semibold text-slate-600 uppercase">Nhận xét của bạn *</label>
                <textarea
                  id="review-comment"
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Nhập nhận xét chi tiết về sản phẩm (chất lượng, đóng gói, giao hàng...)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={submittingReview}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !comment.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {submittingReview ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  Gửi Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
