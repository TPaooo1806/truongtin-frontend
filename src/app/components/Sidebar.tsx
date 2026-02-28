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
        // Gọi API lấy danh sách danh mục đã tạo từ Postman
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
    <div className="category-sidebar shadow-sm border rounded-3 overflow-hidden bg-white">
      <div className="p-3 fw-bold text-white text-uppercase" style={{ backgroundColor: '#5D4037' }}>
        <i className="bi bi-list-task me-2"></i> DANH MỤC SẢN PHẨM
      </div>
      <div className="list-group list-group-flush">
        {loading ? (
          <div className="p-3 text-center">
            <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
          </div>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/category/${cat.slug}`} 
              className="list-group-item list-group-item-action py-3 fw-semibold border-0 text-decoration-none"
              style={{ color: '#5D4037', fontSize: '0.9rem' }}
            >
              <i className="bi bi-tools me-2 text-danger"></i> {cat.name}
              <i className="bi bi-chevron-right float-end small opacity-50"></i>
            </Link>
          ))
        ) : (
          <div className="p-3 text-muted small italic">Chưa có danh mục nào...</div>
        )}
      </div>
    </div>
  );
}