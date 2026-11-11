'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios'; 
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  showOnHome: boolean;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    products: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// BỘ ICON BOOTSTRAP CHUẨN HÓA CHO TỪNG DANH MỤC VẬT TƯ
export const CATEGORY_ICON_PRESETS = [
  { label: 'Bóng đèn', value: 'bi-lightbulb' },
  { label: 'Ống nước', value: 'bi-water' },
  { label: 'Dây điện', value: 'bi-lightning-charge' },
  { label: 'Băng keo', value: 'bi-disc' },
  { label: 'Kềm / Dụng cụ', value: 'bi-wrench-adjustable' },
  { label: 'Lưỡi cắt', value: 'bi-slash-circle' },
  { label: 'Phụ kiện ống', value: 'bi-intersect' },
  { label: 'Silicon', value: 'bi-droplet-half' },
  { label: 'Thiết bị vệ sinh', value: 'bi-badge-wc' },
  { label: 'Đèn âm trần', value: 'bi-circle-square' },
  { label: 'Đồ kim khí', value: 'bi-tools' },
  { label: 'Vật tư / Hộp đựng', value: 'bi-box-seam' },
  { label: 'Phụ tùng / Cơ khí', value: 'bi-gear' },
  { label: 'Nhãn mác / Mặc định', value: 'bi-tag' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'bi-lightbulb',
    showOnHome: false,
    isActive: true,
    displayOrder: 0,
  });
  const [isCustomIcon, setIsCustomIcon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async (page: number) => {
    try {
      setLoading(true);
      // Gọi kèm admin=true để nạp toàn bộ danh mục kể cả danh mục đang bị ẩn (isActive: false)
      const res = await api.get<ApiResponse<Category[]>>(`/api/categories?page=${page}&limit=12&admin=true`);
      if (res.data.success) {
        setCategories(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      icon: 'bi-lightbulb',
      showOnHome: false,
      isActive: true,
      displayOrder: 0,
    });
    setIsCustomIcon(false);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setModalMode('edit');
    setEditingId(cat.id);
    const hasPreset = CATEGORY_ICON_PRESETS.some((p) => p.value === cat.icon);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || 'bi-tag',
      showOnHome: !!cat.showOnHome,
      isActive: cat.isActive !== false,
      displayOrder: cat.displayOrder || 0,
    });
    setIsCustomIcon(!hasPreset && !!cat.icon);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Vui lòng điền đủ Tên danh mục và Slug!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        const res = await api.post<ApiResponse<Category>>('/api/categories', formData);
        if (res.data.success) {
          toast.success(res.data.message || 'Thêm danh mục thành công!');
          setShowModal(false);
          setCurrentPage(1);
          fetchCategories(1);
        }
      } else if (modalMode === 'edit' && editingId) {
        const res = await api.put(`/api/categories/${editingId}`, formData);
        if (res.data.success) {
          toast.success('Cập nhật danh mục thành công!');
          setShowModal(false);
          fetchCategories(currentPage);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickUpdate = async (id: number, field: string, value: any) => {
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    try {
      const res = await api.put(`/api/categories/${id}`, { [field]: value });
      if (res.data.success) {
        toast.success('Đã cập nhật trạng thái');
      }
    } catch {
      toast.error('Lỗi cập nhật danh mục');
      fetchCategories(currentPage); // Revert on error
    }
  };

  // --- HÀM XÓA DANH MỤC CÓ BẢO VỆ CHẶN KHÓA NGOẠI TUYỆT ĐỐI ---
  const handleDelete = async (cat: Category) => {
    const productCount = cat._count?.products || 0;

    // RỦI RO KHÓA NGOẠI: Chặn tuyệt đối nếu danh mục đang có sản phẩm
    if (productCount > 0) {
      await Swal.fire({
        title: 'Không thể xóa danh mục!',
        text: `Danh mục đang có ${productCount} sản phẩm. Vui lòng chuyển các sản phẩm sang danh mục khác trước khi xóa!`,
        icon: 'warning',
        confirmButtonColor: '#0078D4',
        confirmButtonText: 'Đã hiểu',
      });
      return;
    }

    // Nếu danh mục có 0 sản phẩm, xác nhận trước khi xóa
    const result = await Swal.fire({
      title: 'Xóa danh mục?',
      text: `Bạn có chắc muốn xóa vĩnh viễn danh mục "${cat.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Có, xóa danh mục',
      cancelButtonText: 'Hủy',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/api/categories/${cat.id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Đã xóa danh mục');
        fetchCategories(currentPage);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage]);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white position-relative">
      {/* HEADER & NÚT THÊM */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-folder2-open text-primary fs-4"></i> Quản Lý Danh Mục Hàng Hoá
          </h5>
          <span className="text-muted small">
            Quản trị phân loại, icon Bootstrap nhận diện và kiểm soát hiển thị toàn hệ thống
          </span>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-lg"></i> Thêm Danh Mục Mới
        </button>
      </div>

      {/* BẢNG DANH MỤC */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3" style={{ width: '60px' }}>ID</th>
              <th className="border-0">Icon & Tên Danh Mục</th>
              <th className="border-0 text-center" style={{ width: '160px' }}>
                Kích Hoạt (Toàn Trang)
              </th>
              <th className="border-0 text-center" style={{ width: '140px' }}>
                Hiện Trang Chủ
              </th>
              <th className="border-0 text-center" style={{ width: '100px' }}>
                Thứ Tự
              </th>
              <th className="border-0 text-center" style={{ width: '170px' }}>
                Sản Phẩm
              </th>
              <th className="text-end pe-3 border-0 rounded-end-3" style={{ width: '120px' }}>
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <span className="spinner-border spinner-border-sm me-2 text-primary"></span> Đang nạp danh mục...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  Chưa có danh mục nào trong hệ thống.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const productCount = cat._count?.products || 0;
                const isZeroProduct = productCount === 0;

                return (
                  <tr key={cat.id}>
                    {/* ID */}
                    <td className="ps-3 text-muted fw-bold">#{cat.id}</td>

                    {/* ICON & TÊN DANH MỤC */}
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                          style={{
                            width: '42px',
                            height: '42px',
                            backgroundColor: cat.isActive !== false ? '#EBF5FF' : '#F1F5F9',
                            color: cat.isActive !== false ? '#0078D4' : '#64748B',
                          }}
                        >
                          <i className={`bi ${cat.icon || 'bi-tag'} fs-5`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark d-flex align-items-center gap-2">
                            {cat.name}
                            {cat.isActive === false && (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border small" style={{ fontSize: '10px' }}>
                                Đang ẩn toàn trang
                              </span>
                            )}
                          </div>
                          <div className="text-muted small font-monospace" style={{ fontSize: '11px' }}>
                            /{cat.slug} &bull; icon: {cat.icon || 'bi-tag'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CÔNG TẮC KÍCH HOẠT HIỂN THỊ TOÀN TRANG (isActive) */}
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input shadow-none cursor-pointer"
                            type="checkbox"
                            role="switch"
                            checked={cat.isActive !== false}
                            onChange={(e) => handleQuickUpdate(cat.id, 'isActive', e.target.checked)}
                            style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                            title={cat.isActive !== false ? 'Đang bật hiển thị trên toàn trang' : 'Đang ẩn khỏi toàn trang'}
                          />
                        </div>
                        <span
                          className={`small fw-semibold ${cat.isActive !== false ? 'text-success' : 'text-secondary'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {cat.isActive !== false ? 'Đang bật' : 'Đã ẩn'}
                        </span>
                        {/* GỢI Ý ẨN KHI 0 SẢN PHẨM */}
                        {isZeroProduct && cat.isActive !== false && (
                          <span className="badge bg-warning bg-opacity-25 text-warning-emphasis mt-1" style={{ fontSize: '10px' }}>
                            <i className="bi bi-lightbulb me-1"></i>Gợi ý ẩn
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CÔNG TẮC HIỆN TRANG CHỦ (showOnHome) */}
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input shadow-none cursor-pointer"
                            type="checkbox"
                            role="switch"
                            checked={cat.showOnHome}
                            onChange={(e) => handleQuickUpdate(cat.id, 'showOnHome', e.target.checked)}
                            style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                          />
                        </div>
                        <span
                          className={`small fw-semibold ${cat.showOnHome ? 'text-primary' : 'text-muted'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {cat.showOnHome ? 'Trang chủ' : 'Ẩn Home'}
                        </span>
                      </div>
                    </td>

                    {/* THỨ TỰ HIỂN THỊ */}
                    <td className="text-center">
                      <input
                        type="number"
                        className="form-control form-control-sm text-center mx-auto shadow-none border"
                        style={{ width: '65px', borderRadius: '8px' }}
                        defaultValue={cat.displayOrder}
                        onBlur={(e) => handleQuickUpdate(cat.id, 'displayOrder', parseInt(e.target.value) || 0)}
                        title="Số nhỏ hơn sẽ hiển thị trước"
                      />
                    </td>

                    {/* SỐ LƯỢNG SẢN PHẨM */}
                    <td className="text-center">
                      {isZeroProduct ? (
                        <div className="d-flex flex-column align-items-center gap-1">
                          <span
                            className="badge bg-warning bg-opacity-20 text-dark border border-warning-subtle rounded-pill px-3 py-1 fw-medium"
                            style={{ fontSize: '11.5px' }}
                          >
                            <i className="bi bi-clock-history me-1 text-warning-emphasis"></i> 0 SP (Đang nhập)
                          </span>
                        </div>
                      ) : (
                        <span
                          className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-bold"
                          style={{ fontSize: '12px' }}
                        >
                          <i className="bi bi-box-seam me-1"></i> {productCount} sản phẩm
                        </span>
                      )}
                    </td>

                    {/* THAO TÁC */}
                    <td className="text-end pe-3">
                      <div className="d-inline-flex gap-1">
                        {/* NÚT CHỈNH SỬA */}
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn btn-sm btn-light text-primary rounded-circle shadow-sm"
                          style={{ width: '34px', height: '34px' }}
                          title="Chỉnh sửa danh mục"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        {/* NÚT XÓA BẢO VỆ */}
                        <button
                          onClick={() => handleDelete(cat)}
                          className={`btn btn-sm rounded-circle shadow-sm ${
                            isZeroProduct
                              ? 'btn-light text-danger'
                              : 'btn-light text-secondary opacity-50'
                          }`}
                          style={{ width: '34px', height: '34px' }}
                          title={
                            isZeroProduct
                              ? 'Xóa danh mục'
                              : `Không thể xóa (Đang có ${productCount} SP)`
                          }
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
        <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
          <span className="text-muted small">
            Trang {currentPage} trên {totalPages}
          </span>
          <nav>
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link rounded-circle border-0 shadow-sm bg-light text-dark"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button
                    className={`page-link rounded-circle border-0 shadow-sm mx-1 ${
                      currentPage === i + 1 ? 'bg-primary text-white' : 'bg-light text-dark'
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
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
                  className="page-link rounded-circle border-0 shadow-sm bg-light text-dark"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA DANH MỤC */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            className="card border-0 shadow-lg rounded-4 p-4 animate__animated animate__zoomIn"
            style={{ width: '480px', maxWidth: '95vw' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className={`bi ${formData.icon || 'bi-tag'} fs-5`}></i>
                </div>
                <h5 className="fw-bold mb-0 text-dark">
                  {modalMode === 'create' ? 'Thêm Danh Mục Mới' : 'Chỉnh Sửa Danh Mục'}
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-close shadow-none"
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TRƯỜNG CHỌN ICON BOOTSTRAP TRỰC QUAN */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="small fw-bold text-dark mb-0">
                    <i className="bi bi-palette me-1 text-primary"></i> Icon Đại Diện (Bootstrap Icon)
                  </label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none small"
                    onClick={() => setIsCustomIcon(!isCustomIcon)}
                    style={{ fontSize: '11.5px' }}
                  >
                    {isCustomIcon ? '⚡ Chọn theo mẫu' : '✏️ Nhập mã tùy chỉnh'}
                  </button>
                </div>

                {!isCustomIcon ? (
                  <div className="input-group">
                    <span className="input-group-text bg-white border-2">
                      <i className={`bi ${formData.icon || 'bi-tag'} fs-5 text-primary`}></i>
                    </span>
                    <select
                      className="form-select rounded-end-3 shadow-none border-2"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    >
                      {CATEGORY_ICON_PRESETS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label} ({item.value})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="input-group">
                    <span className="input-group-text bg-white border-2">
                      <i className={`bi ${formData.icon || 'bi-tag'} fs-5 text-primary`}></i>
                    </span>
                    <input
                      type="text"
                      className="form-control rounded-end-3 shadow-none border-2"
                      placeholder="VD: bi-tools, bi-water..."
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    />
                  </div>
                )}
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  Hiển thị đồng bộ ngoài Menu Dropdown, Sidebar và trang Chi tiết sản phẩm.
                </small>
              </div>

              {/* TÊN DANH MỤC */}
              <div className="mb-3">
                <label className="small fw-bold text-dark mb-1">Tên Danh Mục</label>
                <input
                  type="text"
                  className="form-control rounded-3 shadow-none border-2"
                  placeholder="VD: Ống nhựa Bình Minh"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              {/* SLUG */}
              <div className="mb-3">
                <label className="small fw-bold text-muted mb-1">Slug (Đường dẫn tĩnh URL)</label>
                <input
                  type="text"
                  className="form-control rounded-3 shadow-none bg-light text-muted font-monospace"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              {/* CÔNG TẮC KÍCH HOẠT HIỂN THỊ TOÀN TRANG (isActive) */}
              <div className="mb-3 p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-bold text-dark small mb-0 d-flex align-items-center gap-1">
                    <i className="bi bi-eye text-primary"></i> Kích Hoạt Hiển Thị Toàn Trang
                  </div>
                  <div className="text-muted" style={{ fontSize: '11.5px', lineHeight: '1.3' }}>
                    Nếu tắt: Ẩn hoàn toàn khỏi Sidebar, Header Dropdown và Search ngoài Frontend.
                  </div>
                </div>
                <div className="form-check form-switch fs-4 mb-0 ms-2">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    role="switch"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </div>
              </div>

              {/* CÔNG TẮC HIỆN TRANG CHỦ (showOnHome) */}
              <div className="mb-3 p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-bold text-dark small mb-0 d-flex align-items-center gap-1">
                    <i className="bi bi-house-door text-success"></i> Hiện Trang Chủ
                  </div>
                  <div className="text-muted" style={{ fontSize: '11.5px', lineHeight: '1.3' }}>
                    Hiển thị một khối danh mục nổi bật kèm sản phẩm tại Trang chủ.
                  </div>
                </div>
                <div className="form-check form-switch fs-4 mb-0 ms-2">
                  <input
                    className="form-check-input cursor-pointer"
                    type="checkbox"
                    role="switch"
                    checked={formData.showOnHome}
                    onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                  />
                </div>
              </div>

              {/* THỨ TỰ HIỂN THỊ */}
              <div className="mb-4">
                <label className="small fw-bold text-dark mb-1">Thứ Tự Ưu Tiên</label>
                <input
                  type="number"
                  className="form-control rounded-3 shadow-none border-2"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                />
                <small className="text-muted" style={{ fontSize: '11px' }}>
                  Số càng nhỏ càng được xếp lên trước (0, 1, 2, ...).
                </small>
              </div>

              {/* NÚT SUBMIT */}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-light rounded-pill fw-bold py-2 flex-grow-1"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary rounded-pill fw-bold py-2 px-4 flex-grow-1 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Đang lưu...
                    </>
                  ) : modalMode === 'create' ? (
                    'Xác Nhận Thêm'
                  ) : (
                    'Cập Nhật Danh Mục'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
