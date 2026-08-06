'use client';

import React, { useState, useEffect } from 'react';
import { addressService } from '../../../_lib/api';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form states
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Location dropdown states (provinces.open-api.vn)
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data || []))
      .catch(err => console.warn('Lỗi tải Tỉnh/Thành:', err));
  }, []);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    const prov = provinces.find(p => String(p.code) === String(code));
    setCity(prov ? prov.name : '');
    setDistrict('');
    setWard('');
    setDistricts([]);
    setWards([]);
    setSelectedDistrictCode('');
    if (code) {
      fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []))
        .catch(err => console.warn('Lỗi tải Quận/Huyện:', err));
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrictCode(code);
    const dist = districts.find(d => String(d.code) === String(code));
    setDistrict(dist ? dist.name : '');
    setWard('');
    setWards([]);
    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []))
        .catch(err => console.warn('Lỗi tải Phường/Xã:', err));
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getMyAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setReceiverName('');
    setPhone('');
    setStreetAddress('');
    setWard('');
    setDistrict('');
    setCity('');
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setDistricts([]);
    setWards([]);
    setIsDefault(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setReceiverName(addr.receiverName);
    setPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setWard(addr.ward);
    setDistrict(addr.district);
    setCity(addr.city);
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setDistricts([]);
    setWards([]);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      alert('Xóa địa chỉ thất bại.');
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await addressService.updateAddress(addr.id, {
        receiverName: addr.receiverName,
        phone: addr.phone,
        streetAddress: addr.streetAddress,
        ward: addr.ward,
        district: addr.district,
        city: addr.city,
        isDefault: true,
      });
      fetchAddresses();
    } catch (err) {
      console.error(err);
      alert('Đặt mặc định thất bại.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const addressData = {
      receiverName,
      phone,
      streetAddress,
      ward,
      district,
      city,
      isDefault,
    };

    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, addressData);
      } else {
        await addressService.createAddress(addressData);
      }
      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu địa chỉ. Vui lòng kiểm tra lại thông tin.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sổ địa chỉ</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý các địa chỉ nhận hàng của bạn.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] cursor-pointer"
        >
          ➕ Thêm địa chỉ mới
        </button>
      </div>

      <hr className="border-slate-200" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-lg">
          Bạn chưa thêm địa chỉ giao hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-lg border transition-all ${
                addr.isDefault 
                  ? 'border-indigo-500/55 bg-indigo-50/15' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{addr.receiverName}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 text-sm">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{addr.streetAddress}</p>
                    <p>{`${addr.ward}, ${addr.district}, ${addr.city}`}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm font-semibold">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="text-slate-600 hover:text-indigo-600 transition-colors border border-slate-200 rounded px-2.5 py-1 hover:bg-slate-50 cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-slate-600 hover:text-red-600 transition-colors border border-slate-200 rounded px-2.5 py-1 hover:bg-slate-50 cursor-pointer"
                  >
                    Xóa
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors border border-indigo-200 rounded px-2.5 py-1 hover:bg-indigo-50 cursor-pointer"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100/50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên người nhận</label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="09XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ cụ thể (Số nhà, đường)</label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: 123 Đường Lê Lợi"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tỉnh / Thành phố</label>
                  <select
                    required
                    value={selectedProvinceCode}
                    onChange={handleProvinceChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">{city ? city : '-- Chọn Tỉnh / Thành --'}</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quận / Huyện</label>
                  <select
                    required
                    disabled={!selectedProvinceCode && districts.length === 0}
                    value={selectedDistrictCode}
                    onChange={handleDistrictChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{district ? district : '-- Chọn Quận / Huyện --'}</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phường / Xã</label>
                  <select
                    required
                    disabled={!selectedDistrictCode && wards.length === 0}
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{ward ? ward : '-- Chọn Phường / Xã --'}</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label htmlFor="modalIsDefault" className="ml-2 block text-sm text-slate-900">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
