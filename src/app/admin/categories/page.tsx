'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios'; 
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async (page: number) => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<Category[]>>(`/api/categories?page=${page}&limit=12`);
      if (res.data.success) {
        setCategories(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (error: unknown) {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    setNewCat({ name, slug });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name || !newCat.slug) {
      toast.error("Vui lòng điền đủ thông tin!");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post<ApiResponse<Category>>('/api/categories', newCat);
      if (res.data.success) {
        toast.success(res.data.message || "Thành công");
        setShowModal(false);
        setNewCat({ name: '', slug: '' });
        setCurrentPage(1);
        fetchCategories(1);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Lỗi tạo danh mục");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HÀM XÓA MỚI ---
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;
    try {
      const res = await api.delete(`/api/categories/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || "Đã xóa");
        fetchCategories(currentPage);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Không thể xóa");
    }
  };

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage]);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Danh Mục Hàng Hoá</h5>
          <span className="text-muted small">Phân loại sản phẩm Trường Tín</span>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold">
          <i className="bi bi-plus-lg me-2"></i> Thêm Danh Mục
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">ID</th>
              <th className="border-0">Tên Danh Mục</th>
              <th className="border-0">Đường Dẫn</th>
              <th className="border-0 text-center">Sản Phẩm</th>
              <th className="text-end pe-3 border-0 rounded-end-3">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-5 text-muted"><span className="spinner-border spinner-border-sm me-2"></span> Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-5 text-muted">Chưa có danh mục nào.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="ps-3 text-muted fw-bold">#{cat.id}</td>
                  <td className="fw-bold text-dark">{cat.name}</td>
                  <td><span className="badge bg-light text-primary border border-primary-subtle px-2">/{cat.slug}</span></td>
                  <td className="text-center">
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">
                      {cat._count?.products || 0}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button 
                      onClick={() => handleDelete(cat.id, cat.name)} // GẮN HÀM XÓA VÀO ĐÂY
                      className="btn btn-sm btn-light text-danger rounded-circle shadow-sm"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
          <span className="text-muted small">Trang {currentPage} trên {totalPages}</span>
          <nav>
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link rounded-circle border-0 shadow-sm bg-light text-dark" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button className={`page-link rounded-circle border-0 shadow-sm mx-1 ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  > {i + 1} </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link rounded-circle border-0 shadow-sm bg-light text-dark" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, backdropFilter: 'blur(3px)' }}>
          <div className="card border-0 shadow-lg rounded-4 p-4 animate__animated animate__zoomIn" style={{ width: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 text-primary">
              <h5 className="fw-bold mb-0">Thêm Danh Mục</h5>
              <button onClick={() => setShowModal(false)} className="btn-close shadow-none"></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="small fw-bold text-muted mb-1">Tên Danh Mục</label>
                <input type="text" className="form-control rounded-3 shadow-none border-2" placeholder="VD: Ống nhựa PPR" value={newCat.name} onChange={handleNameChange} required />
              </div>
              <div className="mb-4">
                <label className="small fw-bold text-muted mb-1">Slug (Tự động)</label>
                <input type="text" className="form-control rounded-3 shadow-none bg-light text-muted" value={newCat.slug} readOnly />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Thêm'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}