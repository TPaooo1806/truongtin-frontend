'use client';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '../type';

interface ProductCardProps {
  item: Product;
}

// [Image Opt] Tối ưu ảnh Cloudinary: Tải ảnh nhỏ 300x300, giảm 95% dung lượng
const getOptimizedUrl = (url: string): string => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto,f_auto/');
};

export default function ProductCard({ item }: ProductCardProps) {
  const prices = item.variants && item.variants.length > 0 ? item.variants.map(v => v.price) : [0];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalStock = item.variants ? item.variants.reduce((sum, v) => sum + v.stock, 0) : 0;
  const rawUrl = item.images && item.images.length > 0 ? item.images[0].url : '';
  const imgUrl = rawUrl ? getOptimizedUrl(rawUrl) : '/no-image.png';

  return (
    <Link href={`/product/${item.slug}`} className="text-decoration-none product-card-link h-100 d-block">
      <div 
        className="card h-100 shadow-sm border-light transition-all" 
        style={{ cursor: 'pointer' }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.08)';
        }} 
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* HÌNH ẢNH: Tỷ lệ 1/1, object-fit-contain để không bị méo */}
        <div className="position-relative w-100 bg-white rounded-top" style={{ aspectRatio: '1/1' }}>
          <Image 
            src={imgUrl} 
            alt={item.name} 
            fill
            className="object-fit-contain p-2" 
            sizes="(max-width: 768px) 50vw, 300px"
            unoptimized={!imgUrl.includes('res.cloudinary.com')}
          />
          {totalStock === 0 && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-top" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <span className="badge bg-danger px-3 py-2 fw-bold" style={{ fontSize: '0.75rem' }}>HẾT HÀNG</span>
            </div>
          )}
        </div>

        {/* CARD BODY: d-flex flex-column để đẩy nội dung */}
        <div className="card-body d-flex flex-column p-2 pt-1">
          
          {/* TÊN SẢN PHẨM: Giới hạn 2 dòng */}
          <h6 
            className="fw-semibold mb-1 text-dark lh-sm" 
            style={{ 
              fontSize: '0.85rem',
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden', 
            }}
          >
            {item.name}
          </h6>

          {/* ĐƠN VỊ TÍNH */}
          <div className="text-muted mb-2 text-truncate" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-box-seam me-1"></i>ĐVT: {item.unit || 'Cái'}
          </div>

          {/* KHU VỰC ĐẨY XUỐNG ĐÁY BẰNG mt-auto */}
          <div className="mt-auto">
            {/* GIÁ TIỀN */}
            <p className="fw-bold mb-2 text-truncate" style={{ fontSize: '1rem', color: '#0078D4' }}>
              {(() => {
                const validPrices = (item.variants || []).map(v => v.price).filter(p => p > 0);
                if (validPrices.length === 0) return <span className="text-brand">Liên hệ báo giá</span>;
                const min = Math.min(...validPrices);
                const max = Math.max(...validPrices);
                if (min === max) return `${min.toLocaleString('vi-VN')} đ`;
                return <><span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>Giá từ: </span>{min.toLocaleString('vi-VN')} đ</>;
              })()}
            </p>

            {/* NÚT MUA NGAY */}
            <button 
              className="btn btn-sm w-100 fw-bold text-white d-flex align-items-center justify-content-center" 
              style={{ transition: 'all 0.2s', fontSize: '0.8rem', padding: '0.4rem 0', borderRadius: '10px', backgroundColor: totalStock === 0 ? '#6c757d' : '#0078D4', border: 'none' }}
              disabled={totalStock === 0}
            >
              <i className="bi bi-cart-plus me-1"></i> {totalStock === 0 ? 'HẾT HÀNG' : 'MUA NGAY'}
            </button>
          </div>
          
        </div>
      </div>
    </Link>
  );
}