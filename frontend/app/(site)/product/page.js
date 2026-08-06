'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { productService, categoryService } from '../../_lib/api';

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Sync URL query params to state
  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (cat) {
      setSelectedCategory(parseInt(cat));
    } else {
      setSelectedCategory(null);
    }
    setSearch(q || '');
    setPage(1);
  }, [searchParams]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        isDiscounted: isDiscounted || undefined,
        onlyInStock: onlyInStock || undefined,
        sortBy,
        page,
        pageSize: 9,
      };
      const data = await productService.getProducts(params);
      const productList = data?.products || data?.items || (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(productList) ? productList : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, page, isDiscounted, onlyInStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleFilterPrice = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setMinPrice('');
    setMaxPrice('');
    setIsDiscounted(false);
    setOnlyInStock(false);
    setSortBy('date-desc');
    setPage(1);
    router.push('/product');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-6">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Tìm kiếm</h3>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                🔍
              </button>
            </form>
          </div>

          {/* Categories Filter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Danh mục</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedCategory(null); setPage(1); }}
                className={`w-full text-left text-xs font-semibold py-1.5 px-2 rounded-md transition-colors ${
                  selectedCategory === null 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tất cả danh mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                  className={`w-full text-left text-xs font-semibold py-1.5 px-2 rounded-md transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📁 {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Khoảng giá</h3>
            <form onSubmit={handleFilterPrice} className="space-y-3">
              <div className="flex gap-2 items-center text-xs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Áp dụng lọc
              </button>
            </form>
          </div>

          {/* Advanced Criteria Filter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-2">Bộ lọc nâng cao</h3>
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={isDiscounted}
                  onChange={(e) => { setIsDiscounted(e.target.checked); setPage(1); }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>⚡ Đang giảm giá</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => { setOnlyInStock(e.target.checked); setPage(1); }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>📦 Chỉ hiện còn hàng</span>
              </label>
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetFilters}
            className="w-full border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Reset tất cả bộ lọc
          </button>
        </aside>

        {/* Products Grid */}
        <main className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-600">
              Sản phẩm hiển thị
            </span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="border rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="date-desc">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl">
              🔍 Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={product.mainImageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        {product.categoryName}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h4>
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                      <div className="text-indigo-600 font-extrabold text-sm">
                        {product.minPrice === product.maxPrice 
                          ? formatPrice(product.minPrice) 
                          : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                        }
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-medium text-slate-400">🏪 {product.shopName}</span>
                        <span>Kho: {product.stockQuantity}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Trước
              </button>
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
