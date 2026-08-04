import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <span className="text-xl">🛠️</span>
        <div className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-indigo-450 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          HITU MARKET ADMIN
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          Quản trị viên
        </span>
        
        <Link 
          href="/" 
          className="text-xs font-bold text-slate-350 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-750 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.03]"
        >
          <span>🏠</span> Quay lại trang chủ
        </Link>
      </div>
    </header>
  );
};

export default Header;
