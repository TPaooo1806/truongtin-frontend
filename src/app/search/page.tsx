'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import type { Product } from '../type';
import api from '@/lib/axios';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const fetchSearchResults = async (keyword: string, page = 1) => {
    if (!keyword) {
      setProducts([]);
      setLoading(false);
      setPagination({ currentPage: 1, totalPages: 1 });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(
        `/api/products?q=${encodeURIComponent(keyword)}&page=${page}&limit=12`
      );

      if (res.data.success) {
        setProducts(res.data.data || []);
        // fallback if backend doesn't return pagination object
        setPagination(res.data.pagination || { currentPage: page, totalPages: 1 });
      } else {
        setProducts([]);
        setPagination({ currentPage: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setProducts([]);
      setPagination({ currentPage: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // fetch when query changes
  useEffect(() => {
    fetchSearchResults(q, 1);
  }, [q]);

  return (
    <div className="container my-4 search-page">
      {/* Header */}
      <div className="search-header bg-white p-3 rounded-4 shadow-sm mb-4">
        <h4 className="fw-bold mb-0 text-dark">
          Kết quả tìm kiếm cho: <span className="text-danger">&quot;{q}&quot;</span>
        </h4>

        {!loading && (
          <p className="text-muted small mt-2 mb-0">
            Tìm thấy <b>{products.length}</b> sản phẩm phù hợp
          </p>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm loading-card">
          <div className="spinner-border text-danger" role="status" aria-hidden="true"></div>
          <p className="mt-2 text-muted fw-bold">Đang tìm kiếm...</p>
        </div>
      ) : (
        <>
          {products.length > 0 ? (
            <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3 mb-4 result-grid">
              {products.map((item) => (
                <div className="col" key={item.id}>
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border empty-card">
              <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }} aria-hidden="true"></i>
              <h5 className="mt-3 text-dark fw-bold">Không tìm thấy sản phẩm nào!</h5>
              <p className="text-muted">Vui lòng thử lại với từ khóa khác (VD: Ống nhựa, Dây cáp, Công tắc...)</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Trang kết quả">
                <ul className="pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <li
                      key={i}
                      className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                    >
                      <button
                        className="page-link shadow-none"
                        onClick={() => fetchSearchResults(q, i + 1)}
                        aria-label={`Trang ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Scoped CSS */}
      <style jsx>{`
        /* Root variables */
        :root {
          --bg: #f6f5f4;
          --card-bg: #ffffff;
          --primary: #d32f2f; /* accent */
          --accent: #5d4037;  /* title brown */
          --muted: #6c757d;
          --radius: 12px;
          --shadow: 0 10px 30px rgba(15, 15, 15, 0.06);
          --transition: 240ms cubic-bezier(0.2, 0.9, 0.3, 1);
        }

        .search-page {
          background-color: var(--bg);
          padding-bottom: 2.5rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #222;
        }

        /* Header */
        .search-header {
          background: linear-gradient(180deg, var(--card-bg), #fff);
          border-radius: var(--radius);
          padding: 18px;
          box-shadow: var(--shadow);
          border-left: 6px solid var(--primary);
        }

        .search-header h4 {
          font-size: 1.125rem;
          color: var(--accent);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .search-header .text-danger {
          color: var(--primary) !important;
          font-weight: 700;
          margin-left: 6px;
        }

        .search-header .text-muted {
          color: var(--muted);
          font-size: 0.95rem;
          margin-top: 8px;
        }

        /* Loading card */
        .loading-card {
          border-radius: var(--radius);
          padding: 32px;
          box-shadow: var(--shadow);
        }

        /* Empty result */
        .empty-card {
          padding: 48px 28px;
          border-radius: var(--radius);
        }

        .empty-card .bi-search {
          color: #cfcfcf;
          font-size: 3.2rem;
          display: block;
          margin: 0 auto;
        }

        .empty-card h5 {
          margin-top: 12px;
          color: #222;
        }

        .empty-card p {
          color: var(--muted);
        }

        /* Grid + cards: style your ProductCard by these selectors
           If your ProductCard uses different classnames, adjust accordingly */
        .result-grid .col {
          animation: fadeInUp 360ms ease both;
        }

        /* Provide defaults that match many ProductCard structures */
        :global(.product-card) {
          background: var(--card-bg);
          border-radius: 10px;
          overflow: hidden;
          transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
          border: 1px solid rgba(0, 0, 0, 0.05);
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        :global(.product-card:hover) {
          transform: translateY(-8px);
          box-shadow: 0 18px 40px rgba(20, 20, 20, 0.08);
          border-color: rgba(0, 0, 0, 0.08);
        }

        /* Image container inside ProductCard */
        :global(.product-img-container) {
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1 / 1;
          transition: transform var(--transition);
          overflow: hidden;
        }
        :global(.product-card:hover .product-img-container) {
          transform: scale(1.01);
        }

        :global(.product-img) {
          transition: transform 450ms var(--transition);
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        :global(.product-card:hover .product-img) {
          transform: scale(1.06);
        }

        :global(.product-title),
        :global(.product-name) {
          color: #333;
          font-size: 0.95rem;
          line-height: 1.2;
          min-height: 2.4rem;
          margin: 10px 0 0;
        }

        :global(.price),
        :global(.product-price) {
          color: var(--primary);
          font-weight: 700;
          font-size: 1rem;
          margin-top: 8px;
        }

        /* Buy button if present */
        :global(.buy-btn) {
          min-width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Pagination */
        .pagination {
          display: flex;
          gap: 6px;
          padding-left: 0;
          list-style: none;
        }

        .pagination .page-item .page-link {
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          margin: 0 6px;
          color: var(--accent);
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: #fff;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .pagination .page-item.active .page-link {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          box-shadow: 0 8px 20px rgba(211, 47, 47, 0.12);
        }

        .pagination .page-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 22px rgba(0, 0, 0, 0.06);
        }

        /* Responsive tweaks */
        @media (max-width: 576px) {
          .search-page .container {
            padding-left: 12px;
            padding-right: 12px;
          }
          .search-header {
            padding: 14px;
            border-left-width: 4px;
          }
          :global(.product-title),
          :global(.product-name) {
            font-size: 0.98rem;
          }
          .pagination .page-link {
            min-width: 40px;
            margin: 0 4px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          :global(.product-card),
          :global(.product-img),
          .pagination .page-link {
            transition: none !important;
            transform: none !important;
          }
        }

        /* Fade up */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Wrap with Suspense for App Router
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Đang tải trang tìm kiếm...</div>}>
      <SearchContent />
    </Suspense>
  );
}