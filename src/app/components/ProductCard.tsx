'use client';
import Link from 'next/link';
import type { Product } from '../type';

interface ProductCardProps {
  item: Product;
}

export default function ProductCard({ item }: ProductCardProps) {
  const price = item.variants && item.variants.length > 0 ? item.variants[0].price : 0;
  const imgUrl = item.images && item.images.length > 0 ? item.images[0].url : 'https://via.placeholder.com/200';

  return (
    <Link href={`/product/${item.slug}`} className="text-decoration-none product-card-link h-100 d-block">
      <div 
        className="h-100 p-2 rounded-3 bg-white border border-light d-flex flex-column justify-content-between transition-all" 
        style={{ 
          transition: 'transform 0.2s, box-shadow 0.2s', 
          cursor: 'pointer',
        }} 
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.08)';
        }} 
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        
        <div>
          {/* HÌNH ẢNH: Tỷ lệ 1:1, giảm margin dưới để gọn hơn */}
          <div className="product-img-container mb-2 rounded border border-light overflow-hidden bg-white" style={{ aspectRatio: '1 / 1' }}>
            <img 
              src={imgUrl} 
              className="product-img w-100 h-100 object-fit-cover" 
              alt={item.name} 
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* TÊN SẢN PHẨM: Giảm font chữ một chút, ép height vừa đủ 2 dòng */}
          <h6 
            className="fw-semibold mb-1 text-dark product-title text-truncate-2 lh-sm" 
            style={{ 
              fontSize: '0.85rem', // Khoảng 14px
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden', 
              height: '34px' // Vừa khít 2 dòng
            }}
          >
            {item.name}
          </h6>

          {/* ĐƠN VỊ TÍNH */}
          <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-box-seam me-1"></i>ĐVT: {item.unit || 'Cái'}
          </div>

          {/* GIÁ TIỀN: Nổi bật nhưng không quá to */}
          <p className="text-danger fw-bold mb-0" style={{ fontSize: '1rem' }}>
            {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
          </p>
        </div>

        {/* NÚT MUA NGAY: Dùng btn-sm để nút nhỏ gọn lại, giảm margin top */}
        <button 
          className="btn btn-outline-danger btn-sm w-100 fw-bold mt-2 buy-btn" 
          style={{ transition: 'all 0.2s', fontSize: '0.8rem', padding: '0.4rem 0' }}
        >
          <i className="bi bi-cart-plus me-1"></i> MUA NGAY
        </button>
      </div>
    </Link>
  );
}