'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface CartItem {
  productId: number;
  productName: string;
  slug: string;
  image: string;
  variantId: number;
  price: number;
  quantity: number;
  unit: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [guestPhone, setGuestPhone] = useState('');

  // FIX LỖI 1: Bọc logic lấy giỏ hàng vào setTimeout để tránh Cascading Renders
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          let parsedCart = JSON.parse(storedCart) as CartItem[];
          
          if (parsedCart.length > 0) {
            try {
              const variantIds = parsedCart.map(i => i.variantId);
              const res = await api.post('/api/cart/validate', { variantIds });
              if (res.data.success) {
                const latestData = res.data.data;
                let hasChanges = false;
                
                parsedCart = parsedCart.map(item => {
                  const latest = latestData.find((l: any) => l.id === item.variantId);
                  if (latest && (latest.price !== item.price)) {
                    hasChanges = true;
                    return { ...item, price: latest.price };
                  }
                  return item;
                });

                if (hasChanges) {
                  toast("Giá hoặc tồn kho của một số vật tư đã được cập nhật mới nhất.", { icon: 'ℹ️' });
                  localStorage.setItem('cart', JSON.stringify(parsedCart));
                }
              }
            } catch (err) {
              console.error("Lỗi validate giỏ hàng", err);
            }
          }
          
          setCart(parsedCart);
        }
      } catch (error) {
        console.error("Lỗi đọc dữ liệu giỏ hàng:", error);
      } finally {
        setIsMounted(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Cập nhật localStorage mỗi khi state cart thay đổi
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [cart, isMounted]);

  // Hàm thay đổi số lượng
  const updateQuantity = (variantId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart => 
      prevCart.map(item => 
        item.variantId === variantId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Hàm xóa sản phẩm
  const removeItem = (variantId: number) => {
    setCart(prevCart => prevCart.filter(item => item.variantId !== variantId));
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Tính năng Guest Cart
  const saveGuestCart = async () => {
    if (!guestPhone) return toast.error("Vui lòng nhập số điện thoại.");
    if (cart.length === 0) return toast.error("Giỏ hàng đang trống.");
    
    try {
      const res = await api.post('/api/guestcart', { phone: guestPhone, cartData: cart });
      if (res.data.success) {
        toast.success("Đã lưu toa hàng an toàn.");
      }
    } catch (err) {
      toast.error("Lỗi lưu toa hàng.");
    }
  };

  const loadGuestCart = async () => {
    if (!guestPhone) return toast.error("Vui lòng nhập số điện thoại.");
    
    try {
      const res = await api.get(`/api/guestcart/${guestPhone}`);
      if (res.data.success && res.data.data.cartData) {
        setCart(res.data.data.cartData);
        toast.success("Đã tải lại toa hàng cũ!");
      }
    } catch (err) {
      toast.error("Không tìm thấy toa hàng cho SĐT này.");
    }
  };

  // Tránh lỗi Hydration của Next.js
  if (!isMounted) return <div className="vh-100 bg-light"></div>;

  return (
    <div className="container my-4 my-md-5">
      <h3 className="fw-bold mb-4 text-dark text-uppercase">
        <i className="bi bi-cart3 me-2 text-brand"></i> Giỏ hàng của bạn
      </h3>

      {cart.length === 0 ? (
        <div className="bg-white p-5 rounded-4 shadow-sm text-center border-brand">
          <div className="mb-4 opacity-75">
  <svg
    width="160"
    height="160"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#b0b0b0"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
</div>
          <h5 className="fw-bold text-dark">Giỏ hàng của bạn đang trống!</h5>
          <p className="text-muted mb-4">Có vẻ như bạn chưa chọn mua vật tư nào.</p>
          <Link href="/san-pham" className="btn btn-brand btn-lg px-5 fw-bold rounded-pill shadow-sm">
            TIẾP TỤC MUA SẮM
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          <div className="col-lg-8">
            <div className="bg-white rounded-4 shadow-sm border-brand overflow-hidden">
              
              {/* Tiêu đề bảng (Chỉ hiện trên PC) */}
              <div className="row m-0 d-none d-md-flex bg-light p-3 border-bottom text-muted fw-bold small text-uppercase">
                <div className="col-md-5">Sản phẩm</div>
                <div className="col-md-2 text-center">Đơn giá</div>
                <div className="col-md-2 text-center">Số lượng</div>
                <div className="col-md-2 text-end">Thành tiền</div>
                <div className="col-md-1"></div>
              </div>

              {/* Danh sách các món hàng */}
              <div className="p-0">
                {cart.map((item, index) => (
                  // FIX LỖI 2 & 3: Đổi toàn bộ cấu trúc sang dùng Grid Bootstrap (row, col)
                  <div key={`${item.variantId}-${index}`} className="row align-items-center m-0 p-3 p-md-4 border-bottom position-relative">
                    
                    {/* Nút Xóa (Mobile: Nằm góc trên phải) */}
                    <button 
                      className="btn btn-link text-danger p-0 position-absolute d-md-none" 
                      style={{ top: '15px', right: '15px', width: 'auto' }}
                      onClick={() => removeItem(item.variantId)}
                    >
                      <i className="bi bi-trash fs-5"></i>
                    </button>

                    {/* Khối Ảnh & Tên */}
                    <div className="col-12 col-md-5 d-flex align-items-center mb-3 mb-md-0 pe-5 pe-md-0">
                      <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                        <div className="position-relative border rounded-3 overflow-hidden bg-light" style={{ width: '80px', height: '80px' }}>
                          <Image 
                            src={item.image} 
                            alt={item.productName} 
                            fill 
                            className="object-fit-cover" 
                            sizes="80px"
                            unoptimized={!item.image.includes('res.cloudinary.com')} 
                          />
                        </div>
                      </Link>
                      <div className="ms-3">
                        <Link href={`/product/${item.slug}`} className="text-decoration-none text-dark fw-bold d-block mb-1" style={{ fontSize: '15px' }}>
                          {item.productName}
                        </Link>
                        <div className="text-muted small">ĐVT: {item.unit || 'Cái'}</div>
                      </div>
                    </div>

                    {/* Khối Đơn giá (Chỉ hiện PC) */}
                    <div className="col-md-2 d-none d-md-block text-center fw-semibold text-dark">
                      {item.price > 0 ? item.price.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}
                    </div>

                    {/* Khối Số lượng */}
                    <div className="col-12 col-md-2 d-flex justify-content-between align-items-center mb-0">
                      <span className="d-md-none text-brand fw-bold">{item.price > 0 ? item.price.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}</span>
                      <div className="input-group border rounded-3 flex-nowrap overflow-hidden" style={{ width: '120px', height: '38px' }}>
                        <button className="btn btn-light border-0 px-2 d-flex align-items-center justify-content-center" style={{ width: '38px' }} onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                          <i className="bi bi-dash-lg"></i>
                        </button>
                        <input 
                          type="number" 
                          className="form-control text-center border-0 bg-white fw-bold px-1" 
                          value={item.quantity} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1) updateQuantity(item.variantId, val);
                          }}
                          min={1}
                          style={{ fontSize: '0.9rem' }}
                        />
                        <button className="btn btn-light border-0 px-2 d-flex align-items-center justify-content-center" style={{ width: '38px' }} onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </div>

                    {/* Khối Thành tiền (Chỉ hiện PC) */}
                    <div className="col-md-2 d-none d-md-block text-end fw-bold text-brand">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </div>

                    {/* Nút Xóa (Chỉ hiện PC) */}
                    <div className="col-md-1 d-none d-md-flex justify-content-end">
                      <button className="btn btn-light text-danger border-0 rounded-circle" onClick={() => removeItem(item.variantId)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-4 text-dark border-bottom pb-3">Tóm tắt đơn hàng</h5>
              
              <div className="d-flex justify-content-between mb-3 text-muted">
                <span>Tổng số lượng:</span>
                <span className="fw-bold text-dark">{cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</span>
              </div>
              
              <div className="d-flex justify-content-between mb-4 text-muted">
                <span>Tạm tính:</span>
                <span className="fw-bold text-dark">{calculateTotal().toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="d-flex justify-content-between mb-4 align-items-center bg-light p-3 rounded-3 border">
                <span className="fw-bold text-dark fs-5">TỔNG CỘNG:</span>
                <span className="fw-bold text-brand fs-4">
                  {cart.some(item => item.price === 0) 
                    ? <span className="fst-italic fs-5">Chờ báo giá</span>
                    : `${calculateTotal().toLocaleString('vi-VN')} đ`
                  }
                </span>
              </div>

              {cart.some(item => item.price === 0) ? (
                <button 
                  className="btn btn-outline-brand btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center" 
                  style={{ padding: '12px 0' }}
                  onClick={async () => {
                    const toastId = toast.loading("Đang tạo toa báo giá...");
                    try {
                      const res = await api.post('/api/quotes', { 
                        phone: guestPhone || "Zalo-Customer", 
                        items: cart
                      });
                      if (res.data.success) {
                        toast.success("Đã tạo toa hàng!", { id: toastId });
                        const message = `Chào Trường Tín, báo giá giúp tôi toa hàng mã: ${res.data.code}`;
                        window.open(`https://zalo.me/0903989096?text=${encodeURIComponent(message)}`, '_blank');
                      }
                    } catch (err) {
                      toast.error("Lỗi khi tạo báo giá.", { id: toastId });
                    }
                  }}
                >
                  <i className="bi bi-chat-dots fs-5 me-2"></i> GỬI YÊU CẦU ZALO BÁO GIÁ
                </button>
              ) : (
                <Link href="/checkout" className="btn btn-brand btn-lg w-100 fw-bold shadow-sm" style={{ padding: '12px 0' }}>
                  THANH TOÁN <i className="bi bi-arrow-right ms-2"></i>
                </Link>
              )}

              <div className="text-center mt-3">
                <Link href="/" className="text-decoration-none text-primary small fw-semibold">
                  <i className="bi bi-arrow-left me-1"></i> Chọn thêm sản phẩm khác
                </Link>
              </div>

              {/* LƯU TOA HÀNG VÃNG LAI */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '15px' }}>
                  <i className="bi bi-cloud-arrow-down me-2"></i>Lưu / Tải lại toa hàng bằng SĐT
                </h6>
                <div className="input-group mb-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nhập số điện thoại..." 
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-primary btn-sm w-50 fw-bold" onClick={saveGuestCart}>Lưu toa hàng</button>
                  <button className="btn btn-outline-success btn-sm w-50 fw-bold" onClick={loadGuestCart}>Tải lại toa cũ</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}