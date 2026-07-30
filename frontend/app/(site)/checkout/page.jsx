'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addressService, cartService, orderService } from '../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addrData, itemsData] = await Promise.all([
          addressService.getMyAddresses(),
          cartService.getMyCart()
        ]);
        setAddresses(addrData);
        setCartItems(itemsData);

        // Pre-select default address or first address
        const def = addrData.find(a => a.isDefault) || addrData[0];
        if (def) setSelectedAddressId(def.id);
      } catch (err) {
        console.error(err);
        setError('Không thể tải thông tin đặt hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert('Vui lòng chọn địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await orderService.checkout(selectedAddressId, paymentMethod);
      alert('Đặt hàng thành công!');
      router.push('/profile/orders');
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng.';
      setError(msg);
      setSubmitting(false);
    }
  };

  // Group by seller for summary
  const grouped = cartItems.reduce((acc, item) => {
    const key = item.product.sellerId;
    if (!acc[key]) acc[key] = { shopName: item.product.shopName, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const totalAmount = cartItems.reduce((sum, item) => sum + item.sku.price * item.quantity, 0);

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

  if (cartItems.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-3 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-900">Giỏ hàng của bạn đang trống</h1>
        <p className="text-sm text-slate-500">Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <Link href="/product" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-all">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Thanh Toán & Đặt Hàng</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Address & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Address Selection */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>📍</span> Địa Chỉ Nhận Hàng
              </h2>
              <Link href="/profile/addresses" className="text-xs font-semibold text-indigo-600 hover:underline">
                + Thêm / Quản lý địa chỉ
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-slate-500">Bạn chưa có địa chỉ nhận hàng nào.</p>
                <Link href="/profile/addresses" className="inline-block text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100">
                  Tạo địa chỉ mới
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div className="space-y-1 text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.receiverName}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">{addr.streetAddress}, {addr.ward}, {addr.district}, {addr.city}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-lg border-b pb-3 flex items-center gap-2">
              <span>💳</span> Phương Thức Thanh Toán
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 border rounded-xl cursor-pointer flex items-center space-x-3 transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900">Thanh toán khi nhận hàng (COD)</div>
                  <div className="text-xs text-slate-500">Thanh toán bằng tiền mặt cho người giao hàng</div>
                </div>
              </label>

              <label
                className={`p-4 border rounded-xl cursor-pointer flex items-center space-x-3 transition-all ${
                  paymentMethod === 'VNPay'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="VNPay"
                  checked={paymentMethod === 'VNPay'}
                  onChange={() => setPaymentMethod('VNPay')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <div className="font-bold text-sm text-slate-900">Ví điện tử / Cổng VNPay</div>
                  <div className="text-xs text-slate-500">Quét mã QR / Thẻ ngân hàng nội địa</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: SubOrders Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-lg border-b pb-3 flex items-center gap-2">
              <span>🛍️</span> Chi Tiết Sản Phẩm ({Object.keys(grouped).length} đơn hàng con)
            </h2>
            <p className="text-xs text-slate-500">Đơn hàng của bạn sẽ được tách theo từng gian hàng để người bán chuẩn bị độc lập.</p>

            <div className="space-y-4">
              {Object.entries(grouped).map(([sellerId, group]) => {
                const shopTotal = group.items.reduce((s, i) => s + i.sku.price * i.quantity, 0);
                return (
                  <div key={sellerId} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 flex justify-between">
                      <span>🏪 Gian hàng: {group.shopName}</span>
                      <span>Tạm tính: {formatPrice(shopTotal)}</span>
                    </div>
                    <div className="divide-y divide-slate-100 p-3 space-y-3">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <img src={item.product.mainImage || 'https://via.placeholder.com/60'} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                          <div className="flex-1 text-xs space-y-0.5">
                            <div className="font-bold text-slate-800 line-clamp-1">{item.product.name}</div>
                            <div className="text-slate-400">{[item.sku.color, item.sku.size].filter(Boolean).join(' / ')}</div>
                            <div className="text-slate-500">{formatPrice(item.sku.price)} x {item.quantity}</div>
                          </div>
                          <div className="font-bold text-slate-800 text-xs">
                            {formatPrice(item.sku.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Total Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-4">
            <h3 className="font-bold text-slate-900 text-lg">Tổng Thanh Toán</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className="text-emerald-600 font-semibold">Miễn phí</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900 text-lg">
                <span>Tổng cộng</span>
                <span className="text-indigo-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting || !selectedAddressId}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-indigo-700 active:scale-98 transition-all hover:scale-[1.02] shadow-md cursor-pointer disabled:bg-slate-300 disabled:scale-100 disabled:shadow-none disabled:pointer-events-none"
            >
              {submitting ? 'Đang xử lý...' : 'Xác Nhận Đặt Hàng'}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-normal">
              Bằng việc nhấn "Xác Nhận Đặt Hàng", bạn đồng ý tuân thủ các điều khoản dịch vụ của HITU MARKET.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
