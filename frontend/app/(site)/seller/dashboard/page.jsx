'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { sellerService, orderService, productService, categoryService } from '../../../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

export default function SellerDashboardPage() {
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wallet'
  const [loading, setLoading] = useState(true);

  // Products states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCat, setNewProductCat] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductImage, setNewProductImage] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('MB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [shopData, statsData, ordersData, walletData] = await Promise.all([
        sellerService.getMyShop(),
        sellerService.getDashboardStats(),
        sellerService.getSellerOrders(),
        sellerService.getWallet()
      ]);
      setShop(shopData);
      setStats(statsData);
      setOrders(ordersData);
      setWallet(walletData);

      if (shopData) {
        const [prodsData, catsData] = await Promise.all([
          productService.getProducts({ sellerId: shopData.id, pageSize: 50 }).catch(() => ({ products: [] })),
          categoryService.getAll().catch(() => [])
        ]);
        setProducts(prodsData.products || prodsData.items || []);
        setCategories(catsData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (subOrderId, newStatus) => {
    try {
      await orderService.updateSubOrderStatus(subOrderId, newStatus);
      alert('Cập nhật trạng thái đơn hàng thành công!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đơn hàng.');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      alert('Số tiền rút không hợp lệ.');
      return;
    }
    if (wallet && amt > wallet.balance) {
      alert('Số tiền rút lớn hơn số dư khả dụng.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      await sellerService.createWithdrawal({
        amount: amt,
        bankName,
        accountNumber,
        accountHolder
      });
      alert('Gửi yêu cầu rút tiền thành công!');
      setWithdrawAmount('');
      setAccountNumber('');
      setAccountHolder('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo yêu cầu rút tiền.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await productService.deleteProduct(id);
      alert('Xóa sản phẩm thành công!');
      if (shop) {
        const prodsData = await productService.getProducts({ sellerId: shop.id, pageSize: 50 });
        setProducts(prodsData.products || prodsData.items || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm.');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductCat || !newProductPrice) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setSubmittingProduct(true);
    try {
      const payload = {
        name: newProductName.trim(),
        description: newProductDesc.trim(),
        categoryId: parseInt(newProductCat),
        defaultPrice: parseFloat(newProductPrice),
        defaultStock: parseInt(newProductStock) || 10,
        images: newProductImage.trim() ? [{ imageUrl: newProductImage.trim(), isMain: true }] : []
      };
      await productService.createProduct(payload);
      alert('Đăng bán sản phẩm mới thành công!');
      setIsProductModalOpen(false);
      setNewProductName('');
      setNewProductDesc('');
      setNewProductCat('');
      setNewProductPrice('');
      setNewProductStock('10');
      setNewProductImage('');
      if (shop) {
        const prodsData = await productService.getProducts({ sellerId: shop.id, pageSize: 50 });
        setProducts(prodsData.products || prodsData.items || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đăng bán sản phẩm.');
    } finally {
      setSubmittingProduct(false);
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

  if (!shop) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-3 max-w-lg mx-auto py-12">
        <h1 className="text-xl font-bold text-slate-900">Bạn Chưa Đăng Ký Mở Shop</h1>
        <p className="text-sm text-slate-500">Đăng ký gian hàng để bắt đầu bán sản phẩm và kiếm doanh thu trên HITU MARKET.</p>
        <Link href="/seller/register" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-all">
          Đăng Ký Mở Shop Ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 font-bold rounded-2xl flex items-center justify-center text-2xl border border-indigo-200">
            {shop.logoUrl ? <img src={shop.logoUrl} alt="" className="w-full h-full rounded-2xl object-cover" /> : '🏪'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{shop.shopName}</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {shop.status === 'Approved' ? 'Đã duyệt' : shop.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{shop.description || 'Chưa có mô tả gian hàng'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setIsProductModalOpen(true);
            }}
            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-indigo-700 transition-all cursor-pointer"
          >
            + Đăng Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Tổng Doanh Thu</div>
          <div className="text-xl font-extrabold text-indigo-600">{formatPrice(stats?.totalRevenue || 0)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Ví Khả Dụng (Rút tiền)</div>
          <div className="text-xl font-extrabold text-emerald-600">{formatPrice(stats?.walletBalance || 0)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Đơn Hàng Chờ Xử Lý</div>
          <div className="text-xl font-extrabold text-amber-500">{stats?.pendingOrders || 0} / {stats?.totalOrders || 0} đơn</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Sản Phẩm Đang Bán</div>
          <div className="text-xl font-extrabold text-slate-800">{stats?.totalProducts || 0} sản phẩm</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 Đơn Hàng Của Shop ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🛍️ Sản Phẩm Của Shop ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'wallet' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💰 Ví Tiền & Rút Tiền
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
              Chưa có đơn hàng nào phát sinh cho gian hàng của bạn.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">Mã đơn con #{order.id}</span> (Thuộc Đơn tổng #{order.orderId})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">PTTT: <strong className="text-slate-700">{order.paymentMethod}</strong></span>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Shipping' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {order.status === 'Pending' ? 'Chờ xử lý' :
                       order.status === 'Processing' ? 'Đang chuẩn bị' :
                       order.status === 'Shipping' ? 'Đang giao' :
                       order.status === 'Delivered' ? 'Đã giao' : 'Đã hủy'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Items */}
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center gap-4 text-xs">
                        <img src={item.imageUrl || 'https://via.placeholder.com/60'} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{item.productName}</div>
                          <div className="text-slate-400">{item.skuInfo}</div>
                          <div className="text-slate-500">{formatPrice(item.priceSnapshot)} x {item.quantity}</div>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {formatPrice(item.priceSnapshot * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100 pt-3 flex flex-wrap justify-between items-center gap-2">
                    <div className="text-xs text-slate-500">
                      Tổng giá trị đơn: <strong className="text-indigo-600 text-sm font-bold">{formatPrice(order.subTotal)}</strong>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                          className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-all cursor-pointer"
                        >
                          Xác Nhận Đơn (Chuyển sang Đang xử lý)
                        </button>
                      )}
                      {order.status === 'Processing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Shipping')}
                          className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition-all cursor-pointer"
                        >
                          Giao Hàng (Chuyển sang Đang giao)
                        </button>
                      )}
                      {order.status === 'Shipping' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                          className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition-all cursor-pointer"
                        >
                          Hoàn Tất (Chuyển sang Đã giao)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: WALLET & WITHDRAWAL */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Create Withdrawal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base border-b pb-3">💳 Tạo Yêu Cầu Rút Tiền</h2>
            
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs space-y-1">
              <div className="text-slate-500 font-medium">Số dư có thể rút</div>
              <div className="text-2xl font-bold text-emerald-700">{formatPrice(wallet?.balance || 0)}</div>
              {wallet?.lockedBalance > 0 && (
                <div className="text-amber-600">Đang chờ xử lý: {formatPrice(wallet.lockedBalance)}</div>
              )}
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700">Số Tiền Muốn Rút (VND) *</label>
                <input
                  type="number"
                  required
                  min={50000}
                  max={wallet?.balance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="VD: 500000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700">Tên Ngân Hàng *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank, MB Bank, Techcombank"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700">Số Tài Khoản *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Nhập số tài khoản"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700">Tên Chủ Tài Khoản *</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw || !wallet || wallet.balance < 50000}
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-700 transition-all shadow-sm disabled:bg-slate-300 cursor-pointer"
              >
                {submittingWithdraw ? 'Đang gửi...' : 'Gửi Yêu Cầu Rút Tiền'}
              </button>
            </form>
          </div>

          {/* Past Withdrawals History */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base border-b pb-3">📜 Lịch Sử Yêu Cầu Rút Tiền</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-400 font-semibold">
                    <th className="pb-2">Ngày tạo</th>
                    <th className="pb-2">Số tiền</th>
                    <th className="pb-2">Ngân hàng / STK</th>
                    <th className="pb-2">Trạng thái</th>
                    <th className="pb-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wallet?.withdrawalRequests?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">Chưa có lịch sử rút tiền nào.</td>
                    </tr>
                  ) : (
                    wallet?.withdrawalRequests?.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="py-3 text-slate-600">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="py-3 font-bold text-slate-900">{formatPrice(req.amount)}</td>
                        <td className="py-3 text-slate-700">
                          <div>{req.bankName}</div>
                          <div className="text-[11px] text-slate-400">{req.accountNumber} ({req.accountHolder})</div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.status === 'Pending' ? 'Chờ duyệt' : req.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">{req.note || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-900 text-base">🛍️ Danh Sách Sản Phẩm Đang Bán</h2>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              + Đăng Sản Phẩm Mới
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              Shop chưa đăng bán sản phẩm nào. Hãy bấm đăng bán sản phẩm mới!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Hình ảnh</th>
                    <th className="pb-3 pr-4">Tên sản phẩm</th>
                    <th className="pb-3 pr-4">Danh mục</th>
                    <th className="pb-3 pr-4">Giá bán</th>
                    <th className="pb-3 pr-4">Tồn kho</th>
                    <th className="pb-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <img 
                          src={p.mainImageUrl || 'https://via.placeholder.com/50'} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200" 
                        />
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-800">
                        {p.name}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        {p.categoryName || 'Mặc định'}
                      </td>
                      <td className="py-3 pr-4 font-bold text-indigo-600">
                        {p.minPrice === p.maxPrice ? formatPrice(p.minPrice) : `${formatPrice(p.minPrice)} - ${formatPrice(p.maxPrice)}`}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 font-medium">
                        {p.stockQuantity} sản phẩm
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 border border-rose-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Product Creation Modal --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Đăng Bán Sản Phẩm Mới</h3>
              <p className="text-xs text-slate-500 mt-1">Điền thông tin chi tiết cho sản phẩm của gian hàng bạn</p>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="space-y-3">
                {/* Product Name */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="VD: Gối cao su non nâng đỡ cổ"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Danh Mục Sản Phẩm *</label>
                  <select
                    required
                    value={newProductCat}
                    onChange={(e) => setNewProductCat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price and Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Giá Bán (VND) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="VD: 250000"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Số Lượng Tồn Kho *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      placeholder="VD: 50"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Main Image URL */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">URL Hình Ảnh Sản Phẩm</label>
                  <input
                    type="url"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    placeholder="VD: https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Mô Tả Sản Phẩm</label>
                  <textarea
                    rows={4}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Nhập mô tả chi tiết của sản phẩm (chất liệu, công dụng, bảo hành...)"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={submittingProduct}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct || !newProductName.trim() || !newProductCat || !newProductPrice}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {submittingProduct ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : null}
                  Đăng Bán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
