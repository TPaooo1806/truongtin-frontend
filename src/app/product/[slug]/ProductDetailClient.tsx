'use client';

import { useEffect, useState, use } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Sidebar from '../../components/Sidebar';
import ProductCard from '../../components/ProductCard';
import toast from 'react-hot-toast'; 
import type { Product, ApiResponse } from '../../type';
import api from '@/lib/axios';

export default function ProductDetailClient({ initialProduct }: { initialProduct: Product }) {
  // State dữ liệu
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [mainImage, setMainImage] = useState(initialProduct.images?.[0]?.url || 'https://via.placeholder.com/400');

  // --- STATE CHỌN SỐ LƯỢNG MUA ---
  const [quantity, setQuantity] = useState(1);

  // --- STATE ĐÁNH GIÁ THỰC TẾ ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // --- ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO GIỎ HÀNG ---
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

  // --- ĐỊNH NGHĨA KIỂU DỮ LIỆU BÌNH LUẬN ---
  interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: { name: string };
  }

  // [AUDIT FIX]: Fetch dữ liệu liên quan & Best sellers phụ thuộc vào initialProduct.id
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRelated(true);
        // Gọi API tối ưu lấy đúng 4 sản phẩm, khác ID hiện tại
        const relatedRes = await api.get<ApiResponse<Product[]>>(`/api/products?categoryId=${initialProduct.categoryId}&excludeId=${initialProduct.id}&limit=4`);
        setRelatedProducts(relatedRes.data.data);

        // Lấy Best Sellers (Có thể cache hoặc tối ưu riêng)
        const allRes = await api.get<ApiResponse<Product[]>>(`/api/products?limit=4`);
        setBestSellers(allRes.data.data);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu phụ:', err);
      } finally {
        setLoadingRelated(false);
      }
    };
    
    // Đặt state ảnh chính lại khi đổi sản phẩm
    setMainImage(initialProduct.images?.[0]?.url || 'https://via.placeholder.com/400');
    setQuantity(1);
    
    fetchData();
  }, [initialProduct.id, initialProduct.categoryId, initialProduct.images]);

  // Kiểm tra đăng nhập khi vừa load trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Kéo danh sách bình luận từ Database (Nên bỏ vào trong `useEffect` lấy chi tiết sản phẩm ở trên)
useEffect(() => {
    if (product) {
      // Đã đổi axios thành api để dùng link Render chính thức
      api.get(`/api/products/${product.id}/reviews`)
        .then(res => setReviews(res.data.data || []))
        .catch(err => console.error("Chưa có API lấy reviews", err));
    }
  }, [product]);


  // --- LOGIC THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = () => {
    if (!product) return;

    const newItem = {
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.images?.[0]?.url || 'https://via.placeholder.com/200',
      variantId: product.variants?.[0]?.id || 0, // Lấy ID phiên bản đầu tiên
      price: product.variants?.[0]?.price || 0,
      quantity: quantity, // State số lượng bạn đang lưu ở trang chi tiết
      unit: product.unit || 'Cái'
    };
    
    const currentVariant = product.variants[0];
    
    // Gắn kiểu CartItem[] cho mảng lấy từ localStorage
    const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Thay 'any' thành 'CartItem'
    const existingItemIndex = cart.findIndex((item: CartItem) => item.variantId === currentVariant.id);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        slug: product.slug,
        image: mainImage,
        variantId: currentVariant.id,
        price: currentVariant.price,
        quantity: quantity,
        unit: product.unit
      });
    }
    
    // 1. Lưu vào Storage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // 2. BẮN TÍN HIỆU CHO HEADER (CHÍNH LÀ DÒNG NÀY ĐÂY!)
    window.dispatchEvent(new Event('cartUpdated'));

    // 3. Hiện thông báo
    toast.success('Đã thêm vào giỏ hàng thành công!');
  };

  // --- LOGIC MỞ APP ZALO TỰ ĐỘNG ---
  const handleZaloContact = () => {
    if (!product) return;
    
    const zaloPhone = '0903989096'; 
    
    const message = `Chào Trường Tín, tôi cần tư vấn/mua sản phẩm: ${product.name} - Số lượng: ${quantity} ${product.unit}. Xin báo giá cho tôi.`;
    window.open(`https://zalo.me/${zaloPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // HÀM GỬI BÌNH LUẬN LÊN DATABASE
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao để đánh giá!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Gọi API thực tế gửi lên Backend
      const res = await api.post(
        '/api/reviews', 
        { productId: product?.id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } } // Phải có token mới được post
      );

      if (res.data.success) {
        toast.success("Cảm ơn bạn đã đánh giá!");
        // Chèn bình luận mới nhất lên đầu danh sách (Cập nhật UI ngay lập tức)
        setReviews([res.data.data, ...reviews]);
        setRating(0);
        setComment('');
      }
    } catch (error) { // Đã xóa : any ở đây
      console.error(error);
      
      // Dùng hàm chuẩn của thư viện Axios để check lỗi API
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
          setIsLoggedIn(false);
        } else {
          toast.error("Có lỗi xảy ra, không thể gửi đánh giá.");
        }
      } else {
        // Bắt các lỗi khác (lỗi mạng, máy tính mất mạng...)
        toast.error("Lỗi không xác định. Vui lòng thử lại sau!");
      }
    }
  };



  if (!product) return <div className="text-center py-5">Sản phẩm không tồn tại!</div>;

  const currentVariant = product.variants?.[0]; // Lấy biến thể mặc định để hiển thị giá, kho

  return (
    <div className="container my-4">
      {/* HÀNG 1: CHI TIẾT SẢN PHẨM & SIDEBAR */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>
        <div className="col-lg-9">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border h-100">
            <div className="row g-4 mb-4">
              
              {/* Cột Trái: Khu vực Hình Ảnh */}
              <div className="col-md-5">
                {/* KHUNG ẢNH LỚN */}
                <div className="border rounded-4 p-2 mb-3 bg-white shadow-sm position-relative overflow-hidden" style={{ height: '350px' }}>
                  <Image 
                    src={mainImage || 'https://via.placeholder.com/400'} 
                    alt={product.name} 
                    fill
                    unoptimized 
                    className="object-fit-contain p-2" 
                  />
                </div>
                
                {/* DANH SÁCH HÌNH NHỎ (THUMBNAILS) */}
                {product.images && product.images.length > 0 && (
                  <div className="d-flex gap-2 overflow-auto pb-2 hide-scrollbar">
                    {product.images.map((img, index) => (
                      <div 
                        key={index} 
                        onClick={() => setMainImage(img.url)} 
                        className={`position-relative border rounded-3 transition-all ${mainImage === img.url ? 'border-brand border-2 shadow-sm' : 'border-light opacity-50'}`} 
                        style={{ minWidth: '70px', height: '70px', cursor: 'pointer', overflow: 'hidden' }} 
                        onMouseOver={(e) => e.currentTarget.classList.remove('opacity-50')}
                        onMouseOut={(e) => {
                          if (mainImage !== img.url) e.currentTarget.classList.add('opacity-50');
                        }}
                      >
                        <Image 
                          src={img.url} 
                          alt={`thumb-${index}`} 
                          fill
                          unoptimized
                          className="object-fit-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Cột Phải: Thông tin tóm tắt */}
              <div className="col-md-7 d-flex flex-column">
                <nav aria-label="breadcrumb" className="mb-2">
                  <ol className="breadcrumb mb-0" style={{ fontSize: '14px' }}>
                    <li className="breadcrumb-item text-muted">Trang chủ</li>
                    <li className="breadcrumb-item fw-semibold" style={{ color: '#5D4037' }}>{product.category?.name}</li>
                  </ol>
                </nav>
                
                <h1 className="fw-bold fs-4 text-dark mb-3 lh-base">{product.name}</h1>
                
                {/* Box thông tin cấu hình (Mã, ĐVT, Tình trạng) */}
                <div className="bg-light border rounded-3 p-3 mb-4 d-flex flex-column gap-2" style={{ fontSize: '15px', color: '#444' }}>
                  <div className="d-flex align-items-center">
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-box-seam me-2 text-muted"></i>
                    <span className="text-muted me-2" style={{ width: '100px' }}>Đơn vị tính:</span> 
                    <span className="fw-semibold text-dark">{product.unit || 'Cái'}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-check-circle me-2 text-muted"></i>
                    <span className="text-muted me-2" style={{ width: '100px' }}>Tình trạng:</span> 
                    {currentVariant?.stock > 0 
                        ? <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-6">Còn hàng</span>
                        : <span className="badge bg-brand-subtle text-brand border border-brand-subtle px-2 py-1 fs-6">Hết hàng</span>
                    }
                  </div>
                </div>

                {/* CHỌN SỐ LƯỢNG */}
                <div className="mb-4 d-flex align-items-center">
                  <div className="text-muted small fw-bold me-3" style={{ width: '85px' }}>Số lượng:</div>
                  <div className="d-flex align-items-center border rounded-3 overflow-hidden" style={{ height: '44px' }}>
                    <button 
                      className="btn btn-light border-0 px-3 h-100 d-flex align-items-center justify-content-center" 
                      style={{ width: '44px', fontSize: '1.2rem' }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <i className="bi bi-dash-lg"></i>
                    </button>
                    <input 
                      type="number" 
                      className="form-control text-center border-0 bg-white fw-bold px-1" 
                      style={{ width: '60px', height: '100%', fontSize: '1.1rem' }}
                      value={quantity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1) setQuantity(val);
                        if (e.target.value === '') setQuantity(1);
                      }}
                      min={1}
                    />
                    <button 
                      className="btn btn-light border-0 px-3 h-100 d-flex align-items-center justify-content-center" 
                      style={{ width: '44px', fontSize: '1.2rem' }}
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                  <span className="ms-2 text-muted small">({product.unit})</span>
                </div>

                {/* Khối Giá Tiền */}
                <div className="p-3 mb-3 rounded-3 border border-brand border-opacity-25" style={{ backgroundColor: '#fffafb' }}>
                  <div className="text-muted small mb-1">Giá bán tham khảo:</div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="text-brand fw-bold" style={{ fontSize: '2rem' }}>
                      {currentVariant?.price ? currentVariant.price.toLocaleString('vi-VN') : 'Liên hệ'}
                    </span>
                    {currentVariant?.price && <span className="text-brand fw-semibold fs-5">đ</span>}
                  </div>
                </div>
                
                {/* Ghi chú giá thay đổi */}
                {!currentVariant?.price ? (
                  <div className="alert alert-warning py-2 px-3 mb-4 d-flex align-items-start gap-2" style={{ fontSize: '0.8rem', borderRadius: '10px' }}>
                    <i className="bi bi-info-circle-fill text-warning mt-1 flex-shrink-0"></i>
                    <span>Sản phẩm này cần <strong>báo giá riêng</strong> theo số lượng và thời điểm. Vui lòng liên hệ Zalo hoặc gọi Hotline <strong>0903 989 096</strong> để được báo giá tốt nhất.</span>
                  </div>
                ) : (
                  <div className="text-muted mb-4 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-exclamation-circle"></i>
                    Giá vật tư có thể thay đổi theo thời điểm. Liên hệ để xác nhận giá mới nhất.
                  </div>
                )}

                {/* Nút Call To Action */}
               {/* Nút Call To Action */}
                <div className="mt-auto d-flex flex-column flex-sm-row gap-3">
                  
                  {/* 💡 CHỈ HIỂN THỊ NÚT KHI CÒN HÀNG (stock > 0) */}
                  {currentVariant && currentVariant.stock > 0 && (
                    <button 
                      className="btn btn-brand btn-lg fw-bold flex-grow-1 shadow-sm d-flex align-items-center justify-content-center" 
                      onClick={handleAddToCart}
                    >
                      <i className="bi bi-cart-plus fs-5 me-2"></i> THÊM VÀO GIỎ
                    </button>
                  )}

                  <button 
                    className="btn btn-outline-brand btn-lg fw-bold flex-grow-1 d-flex align-items-center justify-content-center"
                    onClick={handleZaloContact}
                  >
                    <i className="bi bi-chat-dots fs-5 me-2"></i> LIÊN HỆ ZALO
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mô tả chi tiết */}
            <div className="mt-4 pt-4 border-top">
              <h4 className="fw-bold mb-4" style={{ color: '#5D4037', fontSize: '1.25rem' }}>
                <i className="bi bi-info-square me-2"></i> THÔNG TIN CHI TIẾT
              </h4>
              <div 
                className="lh-lg" 
                style={{ color: '#333', fontSize: '1.05rem', textAlign: 'justify' }} 
                dangerouslySetInnerHTML={{ __html: product.description || '<p className="text-muted">Chưa có thông tin mô tả chi tiết cho sản phẩm này.</p>' }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CÁC PHẦN DƯỚI ĐÂY GIỮ NGUYÊN HOÀN TOÀN TỪ CODE CŨ */}
      {/* ========================================================================= */}

      {/* HÀNG 2: CONTAINER CHUNG CHO CÁC DANH SÁCH SẢN PHẨM (FULL WIDTH) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            
            {/* SECTION: TƯƠNG TỰ */}
            {(loadingRelated || relatedProducts.length > 0) && (
              <section className="mb-5">
                <div className="d-flex align-items-center mb-4">
                  <h4 className="section-title-custom text-uppercase mb-0">Sản phẩm tương tự</h4>
                  <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
                </div>
                
                {/* [AUDIT FIX]: Chỉnh lại lưới responsive Mobile 2, Desktop 4 */}
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                  {loadingRelated ? (
                    // Trạng thái Skeleton
                    Array(4).fill(0).map((_, i) => (
                      <div className="col" key={`skeleton-${i}`}>
                        <div className="card border-0 shadow-sm h-100" aria-hidden="true">
                          <div className="bg-secondary opacity-25 placeholder w-100" style={{ height: '200px' }}></div>
                          <div className="card-body">
                            <h5 className="card-title placeholder-glow"><span className="placeholder col-6"></span></h5>
                            <p className="card-text placeholder-glow"><span className="placeholder col-7"></span></p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Trạng thái có Data
                    relatedProducts.map(item => (
                      <div className="col" key={item.id}><ProductCard item={item} /></div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* SECTION: BÁN CHẠY */}
            <section>
              <div className="d-flex align-items-center mb-4">
                <h4 className="section-title-custom text-uppercase mb-0">Top bán chạy tại Trường Tín</h4>
                <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
              </div>
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
                {bestSellers.map(item => (
                  <div className="col" key={item.id}><ProductCard item={item} /></div>
                ))}
              </div>
            </section>
            
          </div>
        </div>
      </div>

      {/* HÀNG 3: ĐÁNH GIÁ (FULL WIDTH) */}
      <div className="row">
        <div className="col-12">
          <section className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-5">
            <h4 className="section-title-custom text-uppercase mb-5">Đánh giá & Nhận xét</h4>
            
            <div className="row g-5">
              {/* BÊN TRÁI: KHU VỰC ĐÁNH GIÁ */}
              <div className="col-lg-6">
                
                {/* Form nhập đánh giá */}
                <div className="mb-5">
                  {!isLoggedIn ? (
                    <div className="text-center p-4 border rounded-4 bg-light shadow-sm">
                      <p className="fw-bold mb-2">Đăng nhập để chia sẻ trải nghiệm của bạn</p>
                      <button className="btn btn-brand px-4 rounded-pill fw-bold btn-sm" onClick={() => setIsLoggedIn(true)}>ĐĂNG NHẬP</button>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-4 bg-white shadow-sm border-brand border-opacity-25">
                      <p className="fw-bold mb-2 small text-uppercase text-secondary">Đánh giá của bạn:</p>
                      
                      <div className="star-rating-input mb-3 d-flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i 
                            key={star} 
                            className={`bi fs-4 ${star <= (hoverRating || rating) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`} 
                            onMouseEnter={() => setHoverRating(star)} 
                            onMouseLeave={() => setHoverRating(0)} 
                            onClick={() => setRating(star)} 
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                          ></i>
                        ))}
                      </div>

                      <textarea 
                        className="form-control mb-3 border-0 bg-light p-3" 
                        rows={3} 
                        style={{ borderRadius: '12px', fontSize: '14px' }} 
                        placeholder="Cảm nhận của bạn về sản phẩm..." 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                      
                      <div className="text-end">
                        <button className="btn btn-brand px-4 py-2 fw-bold rounded-pill btn-sm" onClick={handleSubmitReview}>GỬI ĐÁNH GIÁ</button>
                      </div>
                    </div>
                  )}
                </div>

              {/* DANH SÁCH BÌNH LUẬN THỰC TẾ TỪ DATABASE */}
                <div className="comment-list">
                  <p className="fw-bold mb-3">Nhận xét từ khách hàng ({product.name})</p>
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-4">
                      <i className="bi bi-chat-left-dots text-muted fs-3 mb-2 d-block"></i>
                      <p className="text-muted small mb-0">Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản phẩm này!</p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="card border-0 bg-light rounded-4 p-3 mb-3 shadow-sm">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          {/* Lấy chữ cái đầu của tên làm Avatar */}
                          <div className="avatar-placeholder shadow-sm bg-primary text-white d-flex align-items-center justify-content-center fw-bold rounded-circle" style={{ width: '40px', height: '40px' }}>
                            {rev.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold small">{rev.user.name}</span>
                              <span className="badge bg-success-subtle text-success border-0 small" style={{ fontSize: '10px' }}>✓ Đã mua</span>
                            </div>
                            <div className="text-warning" style={{ fontSize: '12px' }}>
                              {/* Render số sao tương ứng */}
                              {[1, 2, 3, 4, 5].map(star => (
                                <i key={star} className={`bi ${star <= rev.rating ? 'bi-star-fill' : 'bi-star'}`}></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-secondary small mb-0 ps-1">{rev.comment}</p>
                        <small className="text-muted mt-2 d-block px-1" style={{ fontSize: '11px' }}>
                          {new Date(rev.createdAt).toLocaleString('vi-VN')}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BÊN PHẢI: ĐỂ TRỐNG (Dành cho nội dung tương lai) */}
              <div className="col-lg-6 d-none d-lg-block border-start">
                
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}