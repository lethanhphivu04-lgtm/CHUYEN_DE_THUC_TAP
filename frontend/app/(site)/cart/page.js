'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cartService, authService } from '../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const fetchCart = async () => {
    try {
      const data = await cartService.getMyCart();
      setItems(data);
    } catch (err) {
      if (err.response?.status === 401) setError('Vui lòng đăng nhập để xem giỏ hàng.');
      else setError('Không thể tải giỏ hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchCart(); else setLoading(false); }, [user]);

  const handleUpdateQty = async (itemId, newQty) => {
    try {
      await cartService.updateQuantity(itemId, newQty);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật.');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa.');
    }
  };

  // Group by seller
  const grouped = items.reduce((acc, item) => {
    const key = item.product.sellerId;
    if (!acc[key]) acc[key] = { shopName: item.product.shopName, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const totalAmount = items.reduce((sum, item) => sum + item.sku.price * item.quantity, 0);

  if (loading) return <div className="flex justify-center py-12"><svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>;

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Giỏ Hàng</h1>
        <p className="text-slate-500">Vui lòng đăng nhập để xem giỏ hàng.</p>
        <Link href="/login" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-all">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Giỏ Hàng ({items.length} sản phẩm)</h1>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">{error}</div>}

      {items.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
          <p className="text-slate-500">Giỏ hàng của bạn đang trống.</p>
          <Link href="/product" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-all">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {Object.entries(grouped).map(([sellerId, group]) => (
              <div key={sellerId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-700">🏪 {group.shopName}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4">
                      <Link href={`/product/${item.product.id}`}>
                        <img src={item.product.mainImage || 'https://via.placeholder.com/80'} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link href={`/product/${item.product.id}`} className="font-semibold text-slate-800 text-sm hover:text-indigo-600 transition-colors line-clamp-2">{item.product.name}</Link>
                        <p className="text-xs text-slate-400">
                          {[item.sku.color, item.sku.size].filter(Boolean).join(' / ')}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-600 text-sm">{formatPrice(item.sku.price)}</span>
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer">−</button>
                            <span className="px-3 py-1 text-sm font-semibold text-slate-800 w-10 text-center">{item.quantity}</span>
                            <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.sku.stockQuantity} className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">+</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Thành tiền: <span className="font-bold text-slate-700">{formatPrice(item.sku.price * item.quantity)}</span></span>
                          <button onClick={() => handleRemove(item.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer">Xóa</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-4">
              <h3 className="font-bold text-slate-900">Tóm Tắt Đơn Hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng sản phẩm</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-base">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
              <Link href="/checkout" className="block w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm text-center hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Tiến Hành Đặt Hàng
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
