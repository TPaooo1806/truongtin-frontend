'use client';
import { useEffect, useState } from 'react';
import Link from 'next/navigation'; 
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
    <div className="category-sidebar shadow-sm border rounded-4 overflow-hidden bg-white">
      {/* Tiêu đề cố định */}
      <div className="p-3 fw-bold text-white text-uppercase" style={{ backgroundColor: '#5D4037' }}>
        <i className="bi bi-list-task me-2"></i> DANH MỤC SẢN PHẨM
      </div>

      {/* 💡 SCROLLBOX: Đã fix lại maxHeight để hiện đúng 6 danh mục */}
      <div 
        className="list-group list-group-flush scroll-container" 
        style={{ 
          maxHeight: '355px', // 💡 Con số vàng để hiện vừa khít 6 mục đầu tiên
          overflowY: 'auto',   
          scrollbarWidth: 'thin'
        }}
      >
        {loading ? (
          <div className="p-4 text-center">
            <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <a 
              key={cat.id} 
              href={`/category/${cat.slug}`} 
              className="list-group-item list-group-item-action py-3 fw-semibold border-0 text-decoration-none d-flex justify-content-between align-items-center"
              style={{ 
                color: '#5D4037', 
                fontSize: '0.85rem', 
                borderBottom: '1px solid #f1f1f1',
                height: '59px' // 💡 Ép chiều cao cố định để kiểm soát scroll chính xác
              }}
            >
              <div className="text-truncate me-2">
                <i className="bi bi-tools me-2 text-danger opacity-75"></i> {cat.name}
              </div>
              <i className="bi bi-chevron-right small opacity-50"></i>
            </a>
          ))
        ) : (
          <div className="p-4 text-center text-muted small italic">Chưa có danh mục nào...</div>
        )}
      </div>

      {/* CSS làm thanh cuộn mỏng cho chuyên nghiệp */}
      <style jsx>{`
        .scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: #f8f9fa;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: #5D4037;
        }
      `}</style>
    </div>
  );
}