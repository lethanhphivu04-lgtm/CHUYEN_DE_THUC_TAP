import Header from '../_components/site/Header';

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © 2026 HITU MARKET — Sàn Thương mại Điện tử Đa Người bán
      </footer>
    </div>
  );
}
