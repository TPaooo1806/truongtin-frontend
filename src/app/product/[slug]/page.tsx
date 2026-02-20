'use client';

import { useEffect, useState, use } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Sidebar from '../../components/Sidebar';
import ProductCard from '../../components/ProductCard';
import type { Product, ApiResponse } from '../../type';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // State dữ liệu
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  // State đánh giá
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get<ApiResponse<Product>>(`http://localhost:5000/api/products/${slug}`);
        if (res.data.success) {
          const data = res.data.data;
          setProduct(data);
          setMainImage(data.images?.[0]?.url || 'https://via.placeholder.com/400');

          const relatedRes = await axios.get<ApiResponse<Product[]>>(`http://localhost:5000/api/products?categoryId=${data.categoryId}`);
          setRelatedProducts(relatedRes.data.data.filter(p => p.id !== data.id).slice(0, 6));

          const allRes = await axios.get<ApiResponse<Product[]>>(`http://localhost:5000/api/products`);
          setBestSellers(allRes.data.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Lỗi lấy dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Vui lòng chọn số sao để đánh giá!");
      return;
    }
    alert(`Cảm ơn bạn đã đánh giá ${rating} sao!`);
    setRating(0);
    setComment('');
  };

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="spinner-border text-danger mb-2" role="status"></div>
      <p className="text-danger fw-bold">ĐANG TẢI DỮ LIỆU TRƯỜNG TÍN...</p>
    </div>
  );

  if (!product) return <div className="text-center py-5">Sản phẩm không tồn tại!</div>;

  return (
    <div className="container my-4">
      {/* HÀNG 1: CHI TIẾT SẢN PHẨM & SIDEBAR */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>
        <div className="col-lg-9">
          <div className="bg-white p-4 rounded-4 shadow-sm border h-100">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="border rounded-4 p-3 mb-3 d-flex align-items-center justify-content-center bg-white" style={{ minHeight: '400px' }}>
                  <Image src={mainImage} alt={product.name} width={400} height={400} unoptimized className="object-fit-contain" style={{ maxHeight: '380px', width: 'auto', height: 'auto' }} />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="d-flex gap-2 overflow-auto pb-2">
                    {product.images.map((img, index) => (
                      <div key={index} onClick={() => setMainImage(img.url)} className={`border rounded-3 p-1 cursor-pointer transition-all ${mainImage === img.url ? 'border-danger border-2' : ''}`}>
                        <Image src={img.url} alt="thumb" width={60} height={60} unoptimized className="object-fit-cover rounded" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <nav className="small mb-2"><ol className="breadcrumb"><li className="breadcrumb-item">Trang chủ</li><li className="breadcrumb-item text-danger">{product.category?.name}</li></ol></nav>
                <h1 className="fw-bold fs-3 text-uppercase mb-2" style={{ color: '#5D4037' }}>{product.name}</h1>
                <div className="p-3 mb-4 rounded-3 d-flex align-items-baseline gap-2" style={{ backgroundColor: '#fff5f5' }}>
                  <span className="text-danger fs-2 fw-black">{product.variants?.[0]?.price.toLocaleString('vi-VN')}</span>
                  <span className="text-danger fw-bold">đ</span>
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-danger btn-lg fw-bold py-3"><i className="bi bi-cart-plus-fill me-2"></i> LIÊN HỆ ĐẶT HÀNG</button>
                  <button className="btn btn-outline-success btn-lg fw-bold py-3"><i className="bi bi-whatsapp me-2"></i> TƯ VẤN ZALO</button>
                </div>
              </div>
            </div>
            <div className="mt-5 border-top pt-4">
              <h4 className="section-title-custom text-uppercase">Chi tiết sản phẩm</h4>
              <div className="lh-lg text-secondary" dangerouslySetInnerHTML={{ __html: product.description || 'Đang cập nhật...' }} />
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 2: CONTAINER CHUNG CHO CÁC DANH SÁCH SẢN PHẨM (FULL WIDTH) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            
            {/* SECTION: TƯƠNG TỰ */}
            {relatedProducts.length > 0 && (
              <section className="mb-5">
                <div className="d-flex align-items-center mb-4">
                  <h4 className="section-title-custom text-uppercase mb-0">Sản phẩm tương tự</h4>
                  <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
                </div>
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
                  {relatedProducts.map(item => (
                    <div className="col" key={item.id}><ProductCard item={item} /></div>
                  ))}
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
                <button className="btn btn-danger px-4 rounded-pill fw-bold btn-sm" onClick={() => setIsLoggedIn(true)}>ĐĂNG NHẬP</button>
              </div>
            ) : (
              <div className="p-4 border rounded-4 bg-white shadow-sm border-danger border-opacity-25">
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
                  <button className="btn btn-danger px-4 py-2 fw-bold rounded-pill btn-sm" onClick={handleSubmitReview}>GỬI ĐÁNH GIÁ</button>
                </div>
              </div>
            )}
          </div>

          {/* DANH SÁCH BÌNH LUẬN (Bọc Card) */}
          <div className="comment-list">
            <p className="fw-bold mb-3">Nhận xét từ khách hàng ({product.name})</p>
            
            {/* Comment Card 1 */}
            <div className="card border-0 bg-light rounded-4 p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="avatar-placeholder shadow-sm" style={{ width: '40px', height: '40px' }}>B</div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold small">nguyen***bao</span>
                    <span className="badge bg-success-subtle text-success border-0 small" style={{ fontSize: '10px' }}>✓ Đã mua</span>
                  </div>
                  <div className="text-warning" style={{ fontSize: '12px' }}>
                    <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i>
                  </div>
                </div>
              </div>
              <p className="text-secondary small mb-0 ps-1">Sản phẩm dùng rất êm, đóng gói cẩn thận. Rất đáng tiền!</p>
              <small className="text-muted mt-2 d-block px-1" style={{ fontSize: '11px' }}>20-02-2026 15:30</small>
            </div>

            {/* Comment Card 2 */}
            <div className="card border-0 bg-light rounded-4 p-3 mb-3 shadow-sm">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="avatar-placeholder shadow-sm" style={{ width: '40px', height: '40px', background: '#5D4037' }}>T</div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold small">Trần Văn A</span>
                  </div>
                  <div className="text-warning" style={{ fontSize: '12px' }}>
                    <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-secondary small mb-0 ps-1">Giao hàng hơi chậm một chút nhưng bù lại tư vấn rất nhiệt tình.</p>
              <small className="text-muted mt-2 d-block px-1" style={{ fontSize: '11px' }}>18-02-2026 09:15</small>
            </div>

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