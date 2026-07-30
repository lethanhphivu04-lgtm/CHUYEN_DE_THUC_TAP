'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService, cartService } from '../../../_lib/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interactive states
  const [selectedSku, setSelectedSku] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(productId);
        setProduct(data);
        
        // Find main image
        const mainImg = data.images.find(i => i.isMain) || data.images[0];
        if (mainImg) setActiveImage(mainImg.imageUrl);

        // Pre-select first SKU
        if (data.skus && data.skus.length > 0) {
          const firstSku = data.skus[0];
          setSelectedSku(firstSku);
          setSelectedColor(firstSku.color || '');
          setSelectedSize(firstSku.size || '');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Không thể tải chi tiết sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handler when color or size changes
  useEffect(() => {
    if (!product || !product.skus) return;

    const matchedSku = product.skus.find(
      s => (s.color || '') === selectedColor && (s.size || '') === selectedSize
    );

    if (matchedSku) {
      setSelectedSku(matchedSku);
    } else {
      setSelectedSku(null);
    }
  }, [selectedColor, selectedSize, product]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = async () => {
    if (!selectedSku) {
      alert('Vui lòng chọn đầy đủ phân loại màu sắc và kích thước.');
      return;
    }
    
    setAddingToCart(true);
    try {
      await cartService.addItem(selectedSku.id, quantity);
      setCartSuccess(true);
      setTimeout(() => {
        setCartSuccess(false);
      }, 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng đăng nhập.';
      alert(msg);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error || 'Không tìm thấy sản phẩm.'}
        </div>
        <Link href="/product" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          ← Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const colors = [...new Set(product.skus.map(s => s.color).filter(Boolean))];
  const sizes = [...new Set(product.skus.map(s => s.size).filter(Boolean))];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center space-x-2">
        <Link href="/" className="hover:text-indigo-600">Trang chủ</Link>
        <span>/</span>
        <Link href="/product" className="hover:text-indigo-600">Sản phẩm</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Images Column */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                    activeImage === img.imageUrl 
                      ? 'border-indigo-600' 
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category and Store Name */}
            <div className="flex justify-between items-center text-xs">
              <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full">
                📁 {product.categoryName}
              </span>
              <span className="text-slate-500 font-medium">
                🏪 Gian hàng: <span className="text-indigo-600 font-bold hover:underline cursor-pointer">{product.shopName}</span>
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>

            {/* Dynamic Price Display */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              {selectedSku ? (
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600">
                    {formatPrice(selectedSku.price)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Mã SKU: <span className="font-semibold">{selectedSku.skuCode}</span>
                  </div>
                </div>
              ) : (
                <div className="text-lg text-slate-500 font-semibold italic">
                  Vui lòng chọn phân loại để xem giá
                </div>
              )}
            </div>

            {/* Sku Color Selector */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Màu sắc</span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedColor === color
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sku Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kích thước</span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Quantity info */}
            {selectedSku && (
              <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Tồn kho khả dụng: <span className="font-bold text-slate-800">{selectedSku.stockQuantity} sản phẩm</span></span>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {/* Quantity Selector and Add to Cart Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center border border-slate-200 rounded-lg w-fit overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-2 font-semibold text-slate-800 text-sm w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(q + 1, selectedSku?.stockQuantity || 99))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedSku || selectedSku.stockQuantity <= 0 || addingToCart}
                className="flex-1 bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-indigo-700 active:scale-98 transition-all hover:scale-102 shadow-md cursor-pointer disabled:bg-slate-300 disabled:scale-100 disabled:shadow-none disabled:pointer-events-none flex items-center justify-center space-x-2"
              >
                {addingToCart ? (
                  <span>Đang thêm...</span>
                ) : !selectedSku ? (
                  <span>Chọn phân loại</span>
                ) : selectedSku.stockQuantity <= 0 ? (
                  <span>Hết hàng</span>
                ) : (
                  <span>Thêm vào giỏ hàng</span>
                )}
              </button>
            </div>

            {/* Cart Success Alert */}
            {cartSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between">
                <span>✓ Đã thêm sản phẩm vào giỏ hàng!</span>
                <Link href="/cart" className="underline hover:text-emerald-800">
                  Xem giỏ hàng →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Tab */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg border-b pb-3">Mô tả sản phẩm</h3>
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>
    </div>
  );
}
