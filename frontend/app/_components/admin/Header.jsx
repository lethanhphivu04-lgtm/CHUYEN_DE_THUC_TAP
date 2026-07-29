import React from 'react';

const Header = () => {
  return (
    <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="font-bold text-xl tracking-wide text-indigo-400">
        HITU MARKET ADMIN
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-300">Quản trị viên</span>
      </div>
    </header>
  );
};

export default Header;
