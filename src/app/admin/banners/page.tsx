"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

// --- Interface ---
interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Modal thêm banner
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const initialForm = {
    title: "",
    link: "",
    imageUrl: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch danh sách Banner
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/banners");
      if (res.data.success) {
        setBanners(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải banner:", error);
      toast.error("Không thể tải danh sách Banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // 2. Xử lý Upload Ảnh tức thì (gọi ngay khi chọn file)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chuẩn bị FormData
    const uploadData = new FormData();
    uploadData.append("image", file); // Field phải là "image" khớp backend

    setIsUploading(true);
    try {
      const res = await api.post("/api/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success && res.data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
        toast.success("Tải ảnh lên thành công!");
      } else {
        toast.error("Có lỗi trả về từ máy chủ khi upload ảnh");
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      toast.error("Upload ảnh thất bại!");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input file
    }
  };

  // 3. Xử lý Submit Form (Tạo mới Banner)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate cơ bản
    if (!formData.title.trim()) {
      return toast.error("Vui lòng nhập tên banner");
    }
    if (!formData.imageUrl) {
      return toast.error("Vui lòng tải lên một ảnh banner");
    }

    try {
      const res = await api.post("/api/banners", formData);
      if (res.data.success) {
        toast.success("Thêm banner mới thành công!");
        setShowModal(false);
        setFormData(initialForm); // Reset form
        fetchBanners(); // Tải lại danh sách
      }
    } catch (error) {
      console.error("Lỗi thêm banner:", error);
      toast.error("Lỗi khi lưu banner");
    }
  };

  // 4. Bật/Tắt Banner
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      // Backend dùng route PUT /:id/toggle và nhận { isActive }
      const res = await api.put(`/api/banners/${id}/toggle`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        toast.success(
          !currentStatus ? "Đã BẬT hiển thị banner" : "Đã TẮT hiển thị banner"
        );
        // Cập nhật state nội bộ để UI phản hồi nhanh
        setBanners((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b))
        );
      }
    } catch (error) {
      console.error("Lỗi toggle banner:", error);
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  // 5. Xóa Banner
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
    try {
      const res = await api.delete(`/api/banners/${id}`);
      if (res.data.success) {
        toast.success("Xóa banner thành công!");
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Lỗi xóa banner:", error);
      toast.error("Lỗi khi xóa banner");
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* HEADER QUẢN LÝ */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1">Quản Lý Banner</h4>
          <p className="text-muted mb-0 small">
            Quản lý các banner quảng cáo, khuyến mãi trên trang chủ
          </p>
        </div>
        <button
          className="btn btn-primary rounded-pill px-4 shadow-sm"
          onClick={() => {
            setFormData(initialForm);
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>Thêm Banner Mới
        </button>
      </div>

      {/* DANH SÁCH BANNER (GRID RESPONSIVE) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <i
            className="bi bi-image text-muted"
            style={{ fontSize: "3rem" }}
          ></i>
          <p className="mt-3 text-muted">Chưa có banner nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="row g-4">
          {banners.map((banner) => (
            <div key={banner.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                {/* Ảnh Banner */}
                <div
                  className="position-relative w-100 bg-light"
                  style={{ paddingTop: "50%" }} /* Giữ tỉ lệ ảnh 2:1 */
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                  
                  {/* Overlay Trạng thái */}
                  {!banner.isActive && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{ background: "rgba(0,0,0,0.4)" }}
                    >
                      <span className="badge bg-secondary px-3 py-2 fs-6 rounded-pill">
                        Đang Ẩn
                      </span>
                    </div>
                  )}
                </div>

                {/* Nội dung Card */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold text-truncate mb-2">
                    {banner.title}
                  </h5>
                  
                  {banner.link ? (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary small text-truncate d-block mb-3"
                    >
                      <i className="bi bi-link-45deg me-1"></i>
                      {banner.link}
                    </a>
                  ) : (
                    <span className="text-muted small d-block mb-3">
                      Không có link điều hướng
                    </span>
                  )}

                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                    {/* Toggle Switch */}
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`switch-${banner.id}`}
                        checked={banner.isActive}
                        onChange={() => handleToggleActive(banner.id, banner.isActive)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className={`form-check-label small ms-2 fw-medium ${banner.isActive ? "text-success" : "text-muted"}`}
                        htmlFor={`switch-${banner.id}`}
                        style={{ cursor: "pointer" }}
                      >
                        {banner.isActive ? "Đang Bật" : "Đã Tắt"}
                      </label>
                    </div>

                    {/* Nút Xóa */}
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle"
                      onClick={() => handleDelete(banner.id)}
                      title="Xóa banner"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM MỚI BANNER */}
      {showModal && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Thêm Banner Quảng Cáo</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                
                <div className="modal-body">
                  {/* Tên Banner */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small">
                      Tên Banner (Tiêu đề) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="VD: Khuyến mãi Tết 2026..."
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Link điều hướng */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small">
                      Link điều hướng (Tùy chọn)
                    </label>
                    <input
                      type="url"
                      className="form-control rounded-3"
                      placeholder="https://..."
                      value={formData.link}
                      onChange={(e) =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                    />
                    <div className="form-text small">
                      Đường dẫn khi khách hàng bấm vào ảnh.
                    </div>
                  </div>

                  {/* Upload Ảnh */}
                  <div className="mb-4">
                    <label className="form-label fw-bold small d-block">
                      Hình ảnh Banner <span className="text-danger">*</span>
                    </label>
                    
                    {/* Khu vực Preview Ảnh */}
                    <div 
                      className={`border rounded-4 p-2 text-center position-relative bg-light ${!formData.imageUrl ? "py-5" : ""}`}
                      style={{ borderStyle: "dashed !important" }}
                    >
                      {formData.imageUrl ? (
                        <div className="position-relative w-100" style={{ paddingTop: "50%" }}>
                          <Image
                            src={formData.imageUrl}
                            alt="Preview"
                            fill
                            style={{ objectFit: "contain" }}
                            className="rounded-3"
                            unoptimized
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow"
                            onClick={() => setFormData({ ...formData, imageUrl: "" })}
                            title="Xóa ảnh"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="text-muted">
                          {isUploading ? (
                            <>
                              <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
                              <p className="mb-0 small">Đang tải ảnh lên mây...</p>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cloud-arrow-up fs-2"></i>
                              <p className="mb-0 mt-2 small">Nhấn để chọn ảnh từ máy</p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Input File ẩn đi, đè lên khu vực để dễ click */}
                      <input
                        type="file"
                        accept="image/*"
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ opacity: 0, cursor: "pointer", zIndex: 10 }}
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        title=""
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 border"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 shadow-sm"
                    disabled={isUploading || !formData.imageUrl || !formData.title}
                  >
                    Lưu Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
