'use client';

import React, { useState, useEffect } from 'react';
import { categoryService } from '../../../_lib/api';

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  const fetchData = async () => {
    try {
      const [tree, all] = await Promise.all([categoryService.getTree(), categoryService.getAll()]);
      setCategories(tree);
      setAllCategories(all);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const openCreateModal = (defaultParentId = null) => {
    setEditing(null);
    setName('');
    setDescription('');
    setParentId(defaultParentId ? String(defaultParentId) : '');
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentCategoryId ? String(cat.parentCategoryId) : '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name, description: description || null, parentCategoryId: parentId ? Number(parentId) : null };
    try {
      if (editing) {
        await categoryService.update(editing.id, data);
      } else {
        await categoryService.create(data);
      }
      setShowModal(false);
      setLoading(true);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi.';
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await categoryService.delete(id);
      setLoading(true);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa danh mục.';
      alert(msg);
    }
  };

  const renderTree = (nodes, depth = 0) =>
    nodes.map((cat) => (
      <div key={cat.id} style={{ marginLeft: depth * 24 }}>
        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 group transition-colors">
          <div className="flex items-center space-x-2">
            {cat.children && cat.children.length > 0 ? (
              <button onClick={() => toggleExpand(cat.id)} className="text-slate-400 hover:text-slate-700 w-5 h-5 flex items-center justify-center cursor-pointer">
                {expanded[cat.id] ? '▼' : '▶'}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-slate-300">•</span>
            )}
            <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
            {cat.description && <span className="text-xs text-slate-400 hidden sm:inline">— {cat.description}</span>}
            {cat.children && cat.children.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">{cat.children.length}</span>
            )}
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openCreateModal(cat.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 cursor-pointer" title="Thêm danh mục con">+ Con</button>
            <button onClick={() => openEditModal(cat)} className="text-xs text-slate-600 hover:text-slate-800 font-semibold px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">Sửa</button>
            <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 cursor-pointer">Xóa</button>
          </div>
        </div>
        {expanded[cat.id] && cat.children && cat.children.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));

  if (loading) return <div className="flex justify-center py-12"><svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản Lý Danh Mục Sản Phẩm</h1>
            <p className="text-sm text-slate-500 mt-0.5">Danh mục dạng cây nhiều cấp — {allCategories.length} danh mục</p>
          </div>
          <button onClick={() => openCreateModal()} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
            + Thêm Danh Mục
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">{error}</div>}

        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Chưa có danh mục nào.</p>
        ) : (
          <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">{renderTree(categories)}</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Điện thoại & Máy tính" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mô tả ngắn (tùy chọn)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục cha</label>
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">— Không có (danh mục gốc) —</option>
                  {allCategories.filter((c) => c.id !== editing?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
