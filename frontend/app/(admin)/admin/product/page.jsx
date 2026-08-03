'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productService, categoryService } from '../../../_lib/api';

export default function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    try {
      const params = { page, pageSize: 10 };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      const data = await productService.getProducts(params);
      const productList = data?.products || data?.items || (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(productList) ? productList : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { categoryService.getAll().then(setCategories).catch(console.error); }, []);
  useEffect(() => { setLoading(true); fetchProducts(); }, [page, search, selectedCategory]);

  const handleDelete = async (id) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản Lý Sản Phẩm</h1>
            <p className="text-sm text-slate-500 mt-0.5">Quản lý và kiểm duyệt sản phẩm trên sàn</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Không tìm thấy sản phẩm.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Sản phẩm</th>
                  <th className="pb-3 pr-4">Danh mục</th>
                  <th className="pb-3 pr-4">Gian hàng</th>
                  <th className="pb-3 pr-4">Giá</th>
                  <th className="pb-3 pr-4">Tồn kho</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-3">
                        <img src={p.mainImageUrl || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <Link href={`/product/${p.id}`} className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">{p.name}</Link>
                          <p className="text-xs text-slate-400">ID: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4"><span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{p.categoryName}</span></td>
                    <td className="py-3 pr-4 text-slate-600">{p.shopName}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">
                      {p.minPrice === p.maxPrice ? formatPrice(p.minPrice) : `${formatPrice(p.minPrice)} - ${formatPrice(p.maxPrice)}`}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold ${p.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.stockQuantity > 0 ? p.stockQuantity : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-default transition-colors">← Trước</button>
            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-default transition-colors">Tiếp →</button>
          </div>
        )}
      </div>
    </div>
  );
}
