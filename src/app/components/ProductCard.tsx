'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
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
  const validPrices = (item.variants || []).map((v) => v.price).filter((p) => p > 0);
  const hasPrice = validPrices.length > 0;
  const minPrice = hasPrice ? Math.min(...validPrices) : 0;
  const maxPrice = hasPrice ? Math.max(...validPrices) : 0;
  const totalStock = item.variants ? item.variants.reduce((sum, v) => sum + v.stock, 0) : 0;
  const rawUrl = item.images && item.images.length > 0 ? item.images[0].url : '';
  const imgUrl = rawUrl ? getOptimizedUrl(rawUrl) : '/no-image.png';

  // Xử lý báo giá Zalo an toàn tuyệt đối cho iOS Safari (không dùng async/await trước window.open để tránh bị Safari chặn popup)
  const handleZaloQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const phoneNumber = "0903989096";
    const quoteMessage = `Chào Điện Nước Trường Tín, tôi muốn nhận báo giá sản phẩm: ${item.name}${item.unit ? ` (ĐVT: ${item.unit})` : ''}. Vui lòng tư vấn cho tôi!`;

    // 1. Sao chép nội dung vào Clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(quoteMessage).catch(() => {});
    }

    // 2. Thông báo Toast cho người dùng
    toast.success('Đã sao chép tên sản phẩm! Đang mở Zalo...', {
      icon: '💬',
      duration: 3000,
    });

    // 3. Mở Zalo đồng bộ trực tiếp trong sự kiện click để vượt qua Pop-up Blocker của Safari trên iPhone/iPad
    window.open(`https://zalo.me/${phoneNumber}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Link href={`/product/${item.slug}`} className="text-decoration-none product-card-link h-100 w-100 d-block">
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
        {/* HÌNH ẢNH: Tỷ lệ 1/1, object-fit-contain để không bao giờ bị méo */}
        <div className="position-relative w-100 bg-white rounded-top" style={{ aspectRatio: '1/1' }}>
          <Image 
            src={imgUrl} 
            alt={item.name} 
            fill
            className="object-fit-contain p-2" 
            sizes="(max-width: 768px) 50vw, 300px"
            unoptimized={!imgUrl.includes('res.cloudinary.com')}
          />
          {hasPrice && totalStock === 0 && (
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
            title={item.name}
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
                if (!hasPrice) {
                  return (
                    <span className="text-danger fw-semibold" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-telephone-outbound me-1"></i>Liên hệ báo giá
                    </span>
                  );
                }
                if (minPrice === maxPrice) {
                  return `${minPrice.toLocaleString('vi-VN')} đ`;
                }
                return (
                  <>
                    <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>Giá từ: </span>
                    {minPrice.toLocaleString('vi-VN')} đ
                  </>
                );
              })()}
            </p>

            {/* CONDITIONAL ACTION BUTTON (PHÂN NHÁNH HÀNH ĐỘNG RÕ RÀNG) */}
            {hasPrice ? (
              /* NHÁNH 1: SẢN PHẨM CÓ GIÁ -> NÚT MUA HÀNG TMĐT CHUẨN */
              <button 
                type="button"
                className="btn btn-sm w-100 fw-bold text-white d-flex align-items-center justify-content-center" 
                style={{ 
                  transition: 'all 0.2s', 
                  fontSize: '0.8rem', 
                  padding: '0.42rem 0', 
                  borderRadius: '10px', 
                  backgroundColor: totalStock === 0 ? '#6c757d' : '#0078D4', 
                  border: 'none' 
                }}
                disabled={totalStock === 0}
              >
                {totalStock === 0 ? (
                  <>
                    <i className="bi bi-x-circle me-1"></i> HẾT HÀNG
                  </>
                ) : (
                  <>
                    <i className="bi bi-cart-plus me-1"></i> MUA NGAY
                  </>
                )}
              </button>
            ) : (
              /* NHÁNH 2: SẢN PHẨM KHÔNG CÓ GIÁ CỐ ĐỊNH -> NÚT BÁO GIÁ ZALO */
              <button 
                type="button"
                className="btn btn-sm w-100 fw-bold text-white d-flex align-items-center justify-content-center shadow-sm" 
                onClick={handleZaloQuote}
                style={{ 
                  transition: 'all 0.2s', 
                  fontSize: '0.8rem', 
                  padding: '0.42rem 0', 
                  borderRadius: '10px', 
                  backgroundColor: '#0068FF', 
                  border: 'none' 
                }}
                title="Nhận báo giá trực tiếp qua Zalo Hotline 0903 989 096"
              >
                {/* Zalo Icon SVG */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="me-1" style={{ verticalAlign: '-1px' }}>
                  <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.04-.15.82-.67 2.45-1.57 3.65 1.7-.13 3.42-.76 4.67-1.47.98.26 2.01.41 3.06.41 5.52 0 10-4.03 10-9S17.52 2 12 2z"/>
                </svg>
                BÁO GIÁ ZALO
              </button>
            )}
          </div>
          
        </div>
      </div>
    </Link>
  );
}
