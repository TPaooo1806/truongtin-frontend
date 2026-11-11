'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category } from '../type';
import api from '@/lib/axios';

// Bộ nhớ đệm Client (RAM Memory Cache): Đảm bảo Sidebar chuyển danh mục ngay lập tức 0ms, không bị chớp trắng hay hiện spinner
let memoryCategoryCache: Category[] | null = null;

export default function Sidebar() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>(memoryCategoryCache || []);
  const [loading, setLoading] = useState<boolean>(!memoryCategoryCache);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories');
        if (res.data.success && isMounted) {
          const freshData: Category[] = res.data.data || [];
          memoryCategoryCache = freshData;
          setCategories(freshData);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục Sidebar:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // VẤN ĐỀ 6: ICON CHUYÊN BIỆT CHO TỪNG DANH MỤC
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("băng keo") || n.includes("keo dán")) return "bi-disc text-primary";
    if (n.includes("silicon") || n.includes("keo silicon")) return "bi-droplet-half text-info";
    if (n.includes("phụ kiện")) return "bi-intersect text-warning";
    if (n.includes("kìm") || n.includes("kim khí") || n.includes("đồ nghề") || n.includes("lưỡi cắt") || n.includes("kẽm")) return "bi-wrench-adjustable text-secondary";
    if (n.includes("vệ sinh") || n.includes("thiết bị vệ sinh") || n.includes("van")) return "bi-water text-primary";
    if (n.includes("dây") || n.includes("cáp") || n.includes("thiết bị điện")) return "bi-lightning-charge-fill text-danger";
    if (n.includes("đèn") || n.includes("bóng") || n.includes("chiếu sáng")) return "bi-lightbulb-fill text-warning";
    if (n.includes("ống") || n.includes("nước")) return "bi-droplet-fill text-info";
    return "bi-box-seam text-primary";
  };

  // VẤN ĐỀ 4: SẮP XẾP DANH MỤC (Đẩy danh mục 0 sản phẩm xuống dưới)
  const sortedCategories = [...categories].sort((a, b) => {
    const countA = a._count?.products ?? 0;
    const countB = b._count?.products ?? 0;
    if (countA > 0 && countB === 0) return -1;
    if (countA === 0 && countB > 0) return 1;
    return 0;
  });

  return (
    /* VẤN ĐỀ 5: Sticky Desktop top: 90px và hiển thị tự nhiên, không bị hộp scroll gò bó */
    <div 
      className="category-sidebar shadow-sm border rounded-4 overflow-hidden bg-white sticky-top"
      style={{ top: '90px', zIndex: 10 }}
    >
      {/* Tiêu đề thanh Sidebar thương hiệu Trường Tín */}
      <div 
        className="p-3 fw-bold text-white text-uppercase d-flex align-items-center gap-2" 
        style={{ backgroundColor: '#0078D4', letterSpacing: '0.3px' }}
      >
        <i className="bi bi-list-task fs-5"></i> DANH MỤC SẢN PHẨM
      </div>

      <div className="list-group list-group-flush">
        {/* VẤN ĐỀ 1: MỤC TẤT CẢ SẢN PHẨM Ở ĐẦU TIÊN */}
        <Link
          href="/san-pham"
          className="d-flex align-items-center justify-content-between p-3 border-bottom text-decoration-none transition-all fw-medium sidebar-link"
          style={
            pathname === '/san-pham'
              ? {
                  backgroundColor: '#EBF5FF',
                  color: '#0078D4',
                  borderLeft: '4px solid #0078D4',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                }
              : {
                  fontSize: '0.9rem',
                  color: '#212529',
                }
          }
        >
          <div className="text-truncate me-2 d-flex align-items-center gap-2">
            <i className="bi bi-grid-fill text-primary fs-6"></i>
            <span>Tất cả sản phẩm</span>
          </div>
          <i className="bi bi-chevron-right small opacity-50"></i>
        </Link>

        {/* DANH SÁCH DANH MỤC */}
        {loading && categories.length === 0 ? (
          <div className="p-4 text-center">
            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          </div>
        ) : sortedCategories.length > 0 ? (
          sortedCategories.map((cat) => {
            const isActive = pathname === `/category/${cat.slug}`;
            const count = cat._count?.products;

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="d-flex align-items-center justify-content-between p-3 border-bottom text-decoration-none transition-all fw-medium sidebar-link"
                style={
                  isActive
                    ? {
                        backgroundColor: '#EBF5FF',
                        color: '#0078D4',
                        borderLeft: '4px solid #0078D4',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                      }
                    : {
                        fontSize: '0.9rem',
                        color: '#212529',
                      }
                }
              >
                <div className="text-truncate me-2 d-flex align-items-center gap-2">
                  <i className={`bi ${getCategoryIcon(cat.name)} fs-6`}></i>
                  <span className="text-truncate">{cat.name}</span>
                </div>

                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                  {/* VẤN ĐỀ 4: SỐ ĐẾM SẢN PHẨM BÊN CẠNH TÊN */}
                  {count !== undefined && (
                    <span 
                      className={`badge rounded-pill small ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : count > 0 
                            ? 'bg-light text-secondary border' 
                            : 'bg-light text-muted border-0 opacity-50'
                      }`}
                      style={{ fontSize: '0.72rem', padding: '0.3em 0.6em' }}
                    >
                      {count}
                    </span>
                  )}
                  <i className="bi bi-chevron-right small opacity-50"></i>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-4 text-center text-muted small fst-italic">
            Chưa có danh mục nào...
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar-link:hover {
          background-color: #f0f7ff;
          color: #0078D4 !important;
        }
      `}</style>
    </div>
  );
}
