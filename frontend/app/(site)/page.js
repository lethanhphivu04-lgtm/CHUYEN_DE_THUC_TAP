import Link from 'next/link';

export default function HomePage() {
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
          <Link
            href="/product"
            className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg shadow hover:bg-slate-100 transition-all"
          >
            Xem Sản Phẩm
          </Link>
          <Link
            href="/cart"
            className="bg-indigo-700/50 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg border border-indigo-400/30 transition-all"
          >
            Giỏ Hàng
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
            🛍️
          </div>
          <h3 className="font-bold text-lg">Đa Dạng Gian Hàng</h3>
          <p className="text-sm text-slate-600">Nhiều nhà bán hàng độc lập mang đến danh mục phong phú và giá cả cạnh tranh.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
            📦
          </div>
          <h3 className="font-bold text-lg">Tách Đơn Tự Động</h3>
          <p className="text-sm text-slate-600">Giỏ hàng chứa nhiều người bán tự động phân tách đơn hàng con chuẩn xác.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">
            🛡️
          </div>
          <h3 className="font-bold text-lg">Thanh Toán An Toàn</h3>
          <p className="text-sm text-slate-600">Hỗ trợ COD, VNPay, MoMo cùng cơ chế ví người bán minh bạch.</p>
        </div>
      </section>
    </div>
  );
}
