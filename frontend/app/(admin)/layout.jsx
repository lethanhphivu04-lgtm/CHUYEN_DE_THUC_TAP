import Header from '../_components/admin/Header';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 text-slate-200 p-4 space-y-2 font-medium text-sm hidden md:block">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pb-2">
            Quản Lý Hệ Thống
          </div>
          <Link href="/admin" className="block px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            📊 Dashboard
          </Link>
          <Link href="/admin/user" className="block px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            👥 Quản Lý Người Dùng
          </Link>
          <Link href="/admin/category" className="block px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            📁 Quản Lý Danh Mục
          </Link>
          <Link href="/admin/product" className="block px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            📦 Quản Lý Sản Phẩm
          </Link>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
