'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
  images?: { url: string }[];
}

interface ReviewUser {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
}

interface ReviewItem {
  id: number;
  userName: string;
  userPhone?: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  product?: ReviewProduct;
  user?: ReviewUser;
}

interface ReviewCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState<ReviewCounts>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | ''>('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Fetch danh sách đánh giá từ API
  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (activeTab !== 'ALL') params.append('status', activeTab);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedRating !== '') params.append('rating', selectedRating.toString());

      const res = await api.get(`/api/reviews/admin?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setCurrentPage(res.data.pagination.currentPage || 1);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, selectedRating]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  // 2. Chuyển đổi trạng thái (Duyệt / Ẩn)
  const handleToggleStatus = async (review: ReviewItem) => {
    const nextStatus = review.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    const actionText = nextStatus === 'APPROVED' ? 'Duyệt hiển thị' : 'Ẩn bình luận';

    try {
      const res = await api.put(`/api/reviews/admin/${review.id}/status`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        toast.success(`Đã ${actionText.toLowerCase()} thành công!`);
        // Optimistic UI update
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, status: nextStatus } : r))
        );
        fetchReviews(currentPage);
      }
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // 3. Xóa vĩnh viễn đánh giá
  const handleDelete = async (review: ReviewItem) => {
    const result = await Swal.fire({
      title: 'Xóa vĩnh viễn đánh giá?',
      text: `Bạn có chắc chắn muốn xóa nhận xét của "${review.userName}"? Thao tác này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Có, xóa vĩnh viễn!',
      cancelButtonText: 'Hủy',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/api/reviews/admin/${review.id}`);
      if (res.data?.success) {
        toast.success('Đã xóa vĩnh viễn đánh giá!');
        fetchReviews(currentPage);
      }
    } catch {
      toast.error('Không thể xóa đánh giá này');
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* HEADER & THÔNG TIN TỔNG QUAN */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-chat-heart text-primary fs-3"></i> Quản Lý & Kiểm Duyệt Đánh Giá
          </h4>
          <p className="text-muted mb-0 small">
            Tự động duyệt cmt hợp lệ, tự động ẩn từ cấm/lăng mạ và hỗ trợ gọi chăm sóc khách hàng
          </p>
        </div>
      </div>

      {/* BỘ LỌC TABS NHANH */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            {/* TABS TRẠNG THÁI */}
            <div className="d-flex gap-2 overflow-auto pb-1 pb-md-0">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'ALL'
                    ? 'btn-primary shadow-sm'
                    : 'btn-light text-dark border'
                }`}
                onClick={() => setActiveTab('ALL')}
              >
                <span>Tất cả</span>
                <span className="badge rounded-pill bg-white text-dark small">{counts.all}</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'APPROVED'
                    ? 'btn-success text-white shadow-sm'
                    : 'btn-light text-dark border'
                }`}
                onClick={() => setActiveTab('APPROVED')}
              >
                <i className="bi bi-check-circle-fill text-success" style={activeTab === 'APPROVED' ? { color: '#fff !important' } : {}}></i>
                <span>Đang hiển thị</span>
                <span className={`badge rounded-pill small ${activeTab === 'APPROVED' ? 'bg-white text-success' : 'bg-success text-white'}`}>
                  {counts.approved}
                </span>
              </button>

              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'PENDING'
                    ? 'btn-warning text-dark shadow-sm'
                    : 'btn-light text-dark border'
                }`}
                onClick={() => setActiveTab('PENDING')}
              >
                <i className="bi bi-hourglass-split"></i>
                <span>Chờ duyệt</span>
                {counts.pending > 0 && (
                  <span className="badge rounded-pill bg-danger text-white small">
                    {counts.pending}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'REJECTED'
                    ? 'btn-danger text-white shadow-sm'
                    : 'btn-light text-dark border'
                }`}
                onClick={() => setActiveTab('REJECTED')}
              >
                <i className="bi bi-shield-slash-fill"></i>
                <span>Đã ẩn / Vi phạm từ cấm</span>
                <span className={`badge rounded-pill small ${activeTab === 'REJECTED' ? 'bg-white text-danger' : 'bg-danger bg-opacity-20 text-danger'}`}>
                  {counts.rejected}
                </span>
              </button>
            </div>

            {/* Ô TÌM KIẾM & LỌC SAO */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" style={{ minWidth: '320px' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0 shadow-none bg-light"
                  placeholder="Tìm theo tên, SĐT, cmt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select form-select-sm shadow-none bg-light border"
                style={{ width: '130px' }}
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Tất cả sao</option>
                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                <option value="4">⭐⭐⭐⭐ (4)</option>
                <option value="3">⭐⭐⭐ (3)</option>
                <option value="2">⭐⭐ (2)</option>
                <option value="1">⭐ (1 sao - Chú ý)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐÁNH GIÁ */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 border-0 rounded-start-3" style={{ width: '220px' }}>Khách Hàng</th>
                <th className="border-0" style={{ width: '260px' }}>Sản Phẩm</th>
                <th className="border-0">Đánh Giá & Nhận Xét</th>
                <th className="border-0 text-center" style={{ width: '140px' }}>Thời Gian</th>
                <th className="border-0 text-center" style={{ width: '140px' }}>Trạng Thái</th>
                <th className="text-end pe-4 border-0 rounded-end-3" style={{ width: '150px' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                    Đang nạp dữ liệu đánh giá...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-chat-left-dots fs-1 d-block mb-2 opacity-50"></i>
                    Không tìm thấy đánh giá nào phù hợp.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const phone = rev.userPhone || rev.user?.phone;
                  const email = rev.user?.email;
                  const thumb = rev.product?.images?.[0]?.url || '/placeholder.png';
                  const is1Star = rev.rating <= 2;

                  return (
                    <tr key={rev.id} className={is1Star ? 'bg-danger bg-opacity-10' : ''}>
                      {/* KHÁCH HÀNG (ADMIN XEM ĐẦY ĐỦ SĐT ĐỂ CHĂM SÓC KHÁCH) */}
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                            style={{
                              width: '38px',
                              height: '38px',
                              backgroundColor: is1Star ? '#dc3545' : '#0078D4',
                              fontSize: '13px',
                            }}
                          >
                            {(rev.userName || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.88rem' }}>
                              {rev.userName}
                            </div>
                            {phone ? (
                              <a
                                href={`tel:${phone}`}
                                className="text-decoration-none small text-primary fw-medium d-flex align-items-center gap-1"
                                title="Gọi chăm sóc khách hàng"
                                style={{ fontSize: '12px' }}
                              >
                                <i className="bi bi-telephone-outbound"></i>
                                {phone}
                              </a>
                            ) : (
                              <span className="text-muted small" style={{ fontSize: '11px' }}>
                                Khách vãng lai
                              </span>
                            )}
                            {email && (
                              <div className="text-muted text-truncate" style={{ fontSize: '11px' }}>
                                {email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SẢN PHẨM */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="position-relative rounded-3 overflow-hidden border bg-light flex-shrink-0"
                            style={{ width: '42px', height: '42px' }}
                          >
                            <Image
                              src={thumb}
                              alt={rev.product?.name || 'Sản phẩm'}
                              fill
                              className="object-fit-cover"
                              unoptimized
                            />
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-bold text-dark small text-truncate" title={rev.product?.name}>
                              {rev.product?.name || 'Sản phẩm không xác định'}
                            </div>
                            {rev.product?.slug && (
                              <Link
                                href={`/product/${rev.product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary small text-decoration-none d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '11px' }}
                              >
                                Xem sản phẩm <i className="bi bi-box-arrow-up-right"></i>
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ĐÁNH GIÁ & NHẬN XÉT */}
                      <td>
                        {/* DÃY SAO VÀNG */}
                        <div className="text-warning small mb-1" style={{ fontSize: '13px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`bi ${
                                star <= rev.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'
                              } me-1`}
                            ></i>
                          ))}
                          <span className="text-muted ms-1 small fw-bold">({rev.rating}/5)</span>
                          {is1Star && (
                            <span className="badge bg-danger ms-2" style={{ fontSize: '10px' }}>
                              ⚠️ Đánh giá thấp - Cần chăm sóc
                            </span>
                          )}
                        </div>

                        {/* NỘI DUNG NHẬN XÉT */}
                        <p className="mb-0 text-dark small lh-sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {rev.comment || <em className="text-muted">(Không có lời nhận xét)</em>}
                        </p>

                        {/* CẢNH BÁO TỰ ĐỘNG NẾU VI PHẠM TỪ CẤM */}
                        {rev.status === 'REJECTED' && (
                          <div className="mt-1">
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle small fw-normal">
                              <i className="bi bi-shield-slash me-1"></i> Đã ẩn: Chứa từ ngữ nhạy cảm / xúc phạm
                            </span>
                          </div>
                        )}
                      </td>

                      {/* THỜI GIAN */}
                      <td className="text-center text-muted small" style={{ fontSize: '12px' }}>
                        <div>{new Date(rev.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="fw-medium text-dark">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</div>
                      </td>

                      {/* TRẠNG THÁI */}
                      <td className="text-center">
                        {rev.status === 'APPROVED' && (
                          <span className="badge bg-success bg-opacity-15 text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold">
                            <i className="bi bi-check-circle me-1"></i> Hiển thị
                          </span>
                        )}
                        {rev.status === 'PENDING' && (
                          <span className="badge bg-warning bg-opacity-20 text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-1 fw-bold">
                            <i className="bi bi-clock-history me-1"></i> Chờ duyệt
                          </span>
                        )}
                        {rev.status === 'REJECTED' && (
                          <span className="badge bg-secondary bg-opacity-15 text-secondary border border-secondary-subtle rounded-pill px-3 py-1 fw-bold">
                            <i className="bi bi-eye-slash me-1"></i> Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* THAO TÁC */}
                      <td className="text-end pe-4">
                        <div className="d-inline-flex gap-2">
                          {/* NÚT DUYỆT HOẶC ẨN */}
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1 ${
                              rev.status === 'APPROVED'
                                ? 'btn-outline-warning text-dark'
                                : 'btn-success text-white'
                            }`}
                            onClick={() => handleToggleStatus(rev)}
                            title={rev.status === 'APPROVED' ? 'Ẩn bình luận này' : 'Duyệt hiển thị bình luận'}
                            style={{ fontSize: '11.5px' }}
                          >
                            {rev.status === 'APPROVED' ? (
                              <>
                                <i className="bi bi-eye-slash"></i> Ẩn
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check2"></i> Duyệt
                              </>
                            )}
                          </button>

                          {/* NÚT THÙNG RÁC XÓA VĨNH VIỄN */}
                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger rounded-circle shadow-sm"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleDelete(rev)}
                            title="Xóa vĩnh viễn"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        {!loading && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
            <span className="text-muted small">
              Trang {currentPage} trên {totalPages}
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-circle border-0 shadow-sm bg-white text-dark"
                    onClick={() => fetchReviews(currentPage - 1)}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button
                      className={`page-link rounded-circle border-0 shadow-sm mx-1 ${
                        currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white text-dark'
                      }`}
                      onClick={() => fetchReviews(i + 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-circle border-0 shadow-sm bg-white text-dark"
                    onClick={() => fetchReviews(currentPage + 1)}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

