'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService, categoryService } from '../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

function ProductCard({ product }) {
  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className="aspect-square bg-slate-100 overflow-hidden">
        <img src={product.mainImageUrl || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-baseline justify-between">
          <span className="text-indigo-600 font-bold text-sm">
            {product.minPrice === product.maxPrice ? formatPrice(product.minPrice) : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>🏪 {product.shopName}</span>
          <span className={product.stockQuantity > 0 ? 'text-emerald-500' : 'text-red-400'}>{product.stockQuantity > 0 ? `Còn ${product.stockQuantity}` : 'Hết hàng'}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getProducts({ pageSize: 8 }),
      categoryService.getAll(),
    ]).then(([prodData, catData]) => {
      const productList = prodData?.products || prodData?.items || (Array.isArray(prodData) ? prodData : []);
      setProducts(Array.isArray(productList) ? productList : []);
      setCategories(Array.isArray(catData) ? catData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col items-start justify-center space-y-4">
        <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          HITU MARKET - Sàn Đa Người Bán
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Khám Phá Hàng Ngàn Gian Hàng Uy Tín
        </h1>
        <p className="text-indigo-100 max-w-2xl text-base sm:text-lg">
          Nền tảng mua sắm trực tuyến kết nối hàng ngàn người bán độc lập. Đơn hàng tự động tách gian hàng, thanh toán an toàn & giao hàng tận nơi.
        </p>
        <div className="pt-2 flex space-x-4">
          <Link href="/product" className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg shadow hover:bg-slate-100 transition-all">
            Xem Sản Phẩm
          </Link>
          <Link href="/cart" className="bg-indigo-700/50 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg border border-indigo-400/30 transition-all">
            Giỏ Hàng
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">🛍️</div>
          <h3 className="font-bold text-lg">Đa Dạng Gian Hàng</h3>
          <p className="text-sm text-slate-600">Nhiều nhà bán hàng độc lập mang đến danh mục phong phú và giá cả cạnh tranh.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">📦</div>
          <h3 className="font-bold text-lg">Tách Đơn Tự Động</h3>
          <p className="text-sm text-slate-600">Giỏ hàng chứa nhiều người bán tự động phân tách đơn hàng con chuẩn xác.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">🛡️</div>
          <h3 className="font-bold text-lg">Thanh Toán An Toàn</h3>
          <p className="text-sm text-slate-600">Hỗ trợ COD, VNPay, MoMo cùng cơ chế ví người bán minh bạch.</p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Danh Mục Sản Phẩm</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} href={`/product?category=${c.id}`} className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Sản Phẩm Mới Nhất</h2>
          <Link href="/product" className="text-sm text-indigo-600 font-semibold hover:underline">Xem tất cả →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
