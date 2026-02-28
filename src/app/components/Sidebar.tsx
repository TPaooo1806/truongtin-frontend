'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Category } from '../type';
import api from '@/lib/axios';

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <aside 
      className="category-sidebar d-none d-lg-block sticky-top" 
      style={{ 
        top: '100px', // 💡 Khoảng cách này phải lớn hơn chiều cao Header của bạn
        zIndex: 10,    // 💡 Thấp hơn z-index của Header (thường 1020) để không đè menu
        marginBottom: '2rem'
      }}
    >
      <div className="shadow-sm border rounded-4 overflow-hidden bg-white">
        {/* Tiêu đề */}
        <div className="p-3 fw-bold text-white text-uppercase d-flex align-items-center" style={{ backgroundColor: '#5D4037' }}>
          <i className="bi bi-list-task me-2"></i> DANH MỤC SẢN PHẨM
        </div>

        {/* 💡 Vùng cuộn nội bộ */}
        <div 
          className="list-group list-group-flush" 
          style={{ 
            maxHeight: 'calc(100vh - 200px)', // 💡 Tự động tính toán chiều cao dựa trên màn hình
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
            </div>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/category/${cat.slug}`} 
                className="list-group-item list-group-item-action py-3 fw-semibold border-0 text-decoration-none d-flex justify-content-between align-items-center"
                style={{ 
                  color: '#5D4037', 
                  fontSize: '0.85rem',
                  borderBottom: '1px solid #f8f9fa' 
                }}
              >
                <div className="text-truncate me-2">
                  <i className="bi bi-tools me-2 text-danger opacity-75"></i> {cat.name}
                </div>
                <i className="bi bi-chevron-right small opacity-50"></i>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted small italic">Chưa có danh mục nào...</div>
          )}
        </div>
      </div>

      {/* 💡 CSS Tinh chỉnh thanh cuộn cho chuyên nghiệp */}
      <style jsx>{`
        .list-group::-webkit-scrollbar {
          width: 5px;
        }
        .list-group::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .list-group::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .list-group::-webkit-scrollbar-thumb:hover {
          background: #5D4037;
        }
      `}</style>
    </aside>
  );
}