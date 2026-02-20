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
    <Link href={`/product/${item.slug}`} className="text-decoration-none product-card-link">
      <div className="h-100 p-2 p-md-3 rounded-4 bg-white shadow-sm d-flex flex-column justify-content-between product-card transition-all" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
        
        <div>
          {/* FIX LỖI ẢNH: Đặt tỷ lệ 1:1 (vuông) và ẩn phần thừa */}
          <div className="product-img-container mb-3 rounded-3 overflow-hidden bg-light" style={{ aspectRatio: '1 / 1' }}>
            <img 
              src={imgUrl} 
              className="product-img w-100 h-100 object-fit-cover" 
              alt={item.name} 
              style={{ objectFit: 'cover' }} // Ép ảnh cắt vừa khung mà không bị méo
            />
          </div>

          {/* Tên sản phẩm */}
          <h6 className="fw-bold mb-1 text-dark product-title text-truncate-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>
            {item.name}
          </h6>

          {/* Đơn vị tính */}
          <div className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-box me-1"></i>ĐVT: {item.unit || 'Cái'}
          </div>

          {/* Giá tiền */}
          <p className="text-danger fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
            {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : 'Liên hệ'}
          </p>
        </div>

        {/* Nút mua ngay */}
        <button className="btn btn-outline-danger w-100 fw-bold mt-3 buy-btn" style={{ transition: 'all 0.2s' }}>
          MUA NGAY
        </button>
      </div>
    </Link>
  );
}