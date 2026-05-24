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
            <div className="spinner-border spinner-border-sm text-brand" role="status"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((cat) => {
            const getCategoryIcon = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes("ống nước")) return "bi-droplet";
              if (n.includes("phụ kiện")) return "bi-wrench-adjustable";
              if (n.includes("bóng đèn")) return "bi-lightbulb";
              if (n.includes("thiết bị điện") || n.includes("dây điện")) return "bi-lightning-charge";
              return "bi-tools";
            };
            return (
            <a
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="d-flex align-items-center justify-content-between p-3 border-bottom text-dark text-decoration-none transition-all fw-medium sidebar-item"
              style={{ fontSize: "0.9rem" }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e8f4fd";
                e.currentTarget.style.color = "#0078D4";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#212529";
              }}
            >
              <div className="text-truncate me-2">
                <i className={`bi ${getCategoryIcon(cat.name)} me-2 text-brand opacity-75`}></i> {cat.name}
              </div>
              <i className="bi bi-chevron-right small opacity-50"></i>
            </a>
          )})
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