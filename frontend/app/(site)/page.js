'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService, categoryService } from '../_lib/api';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

function ProductCard({ product }) {
  const hasDiscount = product.minOriginalPrice && product.minOriginalPrice > product.minPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((product.minOriginalPrice - product.minPrice) / product.minOriginalPrice) * 100) 
    : 0;

  return (
    <Link href={`/product/${product.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative flex flex-col justify-between h-full">
      {hasDiscount && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-sm uppercase tracking-wider animate-pulse">
          -{discountPercent}%
        </div>
      )}
      <div>
        <div className="aspect-square bg-slate-100 overflow-hidden relative">
          <img src={product.mainImageUrl || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="p-3.5 space-y-1">
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{product.name}</h3>
          <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
            <span className="text-indigo-600 font-extrabold text-sm sm:text-base">
              {product.minPrice === product.maxPrice ? formatPrice(product.minPrice) : `${formatPrice(product.minPrice)}`}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                {product.minOriginalPrice === product.maxOriginalPrice ? formatPrice(product.minOriginalPrice) : `${formatPrice(product.minOriginalPrice)}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-3.5 pt-0 flex justify-between items-center text-[10px] sm:text-xs text-slate-400 border-t border-slate-50 mt-1">
        <span className="truncate max-w-[90px] font-medium">🏪 {product.shopName}</span>
        <span className={product.stockQuantity > 0 ? 'text-emerald-500 font-bold' : 'text-rose-400 font-bold'}>{product.stockQuantity > 0 ? `Còn ${product.stockQuantity}` : 'Hết'}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [homeSearch, setHomeSearch] = useState('');
  const [latestProducts, setLatestProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getProducts({ pageSize: 4, sortBy: 'date-desc' }),
      productService.getProducts({ pageSize: 4, sortBy: 'hot' }),
      productService.getProducts({ pageSize: 4, isDiscounted: true }),
      categoryService.getAll(),
    ]).then(([latestData, hotData, discountData, catData]) => {
      setLatestProducts(latestData?.products || latestData?.items || (Array.isArray(latestData) ? latestData : []));
      setHotProducts(hotData?.products || hotData?.items || (Array.isArray(hotData) ? hotData : []));
      setDiscountedProducts(discountData?.products || discountData?.items || (Array.isArray(discountData) ? discountData : []));
      setCategories(Array.isArray(catData) ? catData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col items-start justify-center space-y-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none"></div>
        <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          HITU MARKET - SÀN ĐA NGƯỜI BÁN
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl leading-none">
          Khám Phá Hàng Ngàn Gian Hàng Uy Tín
        </h1>
        <p className="text-indigo-100 max-w-2xl text-base sm:text-lg">
          Nền tảng mua sắm trực tuyến kết nối các người bán độc lập. Đơn hàng tự động tách gian hàng, thanh toán an toàn & giao hàng siêu tốc.
        </p>

        {/* Search Bar Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (homeSearch.trim()) {
              router.push(`/product?search=${encodeURIComponent(homeSearch.trim())}`);
            }
          }}
          className="w-full max-w-xl pt-2 relative z-10"
        >
          <div className="relative">
            <input
              type="text"
              value={homeSearch}
              onChange={(e) => setHomeSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu, nhu cầu..."
              className="w-full px-5 py-4 pl-12 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-800 rounded-2xl border border-white/20 focus:border-white focus:outline-none focus:ring-4 focus:ring-indigo-500/30 placeholder-indigo-200 focus:placeholder-slate-400 shadow-lg transition-all text-sm sm:text-base font-semibold"
            />
            <span className="absolute left-4 top-4 text-white/50 focus-within:text-slate-400 pointer-events-none text-lg">
              🔍
            </span>
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
            >
              Tìm kiếm
            </button>
          </div>
        </form>

        <div className="pt-1 flex space-x-4">
          <Link href="/product" className="bg-white text-indigo-600 font-bold px-6 py-3.5 rounded-xl shadow hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all text-sm">
            Xem Sản Phẩm
          </Link>
          <Link href="/cart" className="bg-indigo-800/40 hover:bg-indigo-800/70 text-white font-bold px-6 py-3.5 rounded-xl border border-indigo-400/30 transition-all text-sm">
            Giỏ Hàng
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">🛍️</div>
          <h3 className="font-extrabold text-slate-800 text-lg">Đa Dạng Gian Hàng</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Nhiều nhà bán hàng độc lập mang đến danh mục phong phú và giá cả cạnh tranh.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">📦</div>
          <h3 className="font-extrabold text-slate-800 text-lg">Tách Đơn Tự Động</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Giỏ hàng chứa nhiều người bán tự động phân tách đơn hàng con chuẩn xác.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xl">🛡️</div>
          <h3 className="font-extrabold text-slate-800 text-lg">Thanh Toán An Toàn</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Hỗ trợ COD, VNPay, MoMo cùng cơ chế ví người bán minh bạch.</p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🗂️</span>
            <h2 className="text-xl font-black text-slate-900">Danh Mục Sản Phẩm</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} href={`/product?category=${c.id}`} className="bg-white border border-slate-200 rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECTION 1: DISCOUNTED PRODUCTS */}
          {discountedProducts.length > 0 && (
            <section className="space-y-5 bg-gradient-to-br from-rose-50/50 to-orange-50/30 p-6 rounded-3xl border border-rose-100/60">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl animate-bounce">⚡</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none">Siêu Ưu Đãi Giảm Giá</h2>
                    <p className="text-xs text-rose-500 font-bold mt-1 uppercase tracking-wide">Ưu đãi độc quyền số lượng có hạn</p>
                  </div>
                </div>
                <Link href="/product" className="text-xs sm:text-sm text-rose-600 font-extrabold hover:underline flex items-center space-x-1">
                  <span>Xem tất cả</span>
                  <span>→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {discountedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* SECTION 2: HOT PRODUCTS */}
          {hotProducts.length > 0 && (
            <section className="space-y-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6 rounded-3xl border border-amber-100/60">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none">Sản Phẩm Bán Chạy</h2>
                    <p className="text-xs text-amber-600 font-bold mt-1 uppercase tracking-wide">Xu hướng mua sắm thịnh hành</p>
                  </div>
                </div>
                <Link href="/product" className="text-xs sm:text-sm text-amber-600 font-extrabold hover:underline flex items-center space-x-1">
                  <span>Xem tất cả</span>
                  <span>→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {hotProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* SECTION 3: LATEST PRODUCTS */}
          {latestProducts.length > 0 && (
            <section className="space-y-5 bg-gradient-to-br from-indigo-50/40 to-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none">Sản Phẩm Mới Nhất</h2>
                    <p className="text-xs text-indigo-500 font-bold mt-1 uppercase tracking-wide">Bộ sưu tập sản phẩm mới lên sàn</p>
                  </div>
                </div>
                <Link href="/product" className="text-xs sm:text-sm text-indigo-600 font-extrabold hover:underline flex items-center space-x-1">
                  <span>Xem tất cả</span>
                  <span>→</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {latestProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
