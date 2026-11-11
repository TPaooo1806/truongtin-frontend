"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Swal from "sweetalert2";

// --- Interface ---
interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  position: "HOME_MAIN" | "HOME_SUB_LEFT" | "HOME_SUB_RIGHT" | string;
  isActive: boolean;
  createdAt: string;
}

interface ImageMeta {
  originalSize: number; // bytes
  compressedSize: number; // bytes
  width: number;
  height: number;
  aspectRatio: number;
  isStandardRatio: boolean;
  reductionPercent: number;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Thêm / Chỉnh Sửa Banner
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const initialForm = {
    title: "",
    link: "",
    imageUrl: "",
    position: "HOME_MAIN",
  };
  const [formData, setFormData] = useState(initialForm);

  // State Preview & Phân tích ảnh
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Cleanup object URL khi unmount hoặc đổi ảnh
  useEffect(() => {
    return () => {
      if (previewBlobUrl && previewBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // HÀM NÉN ẢNH CLIENT-SIDE (HTML5 Canvas -> .webp 85%)
  const compressImage = async (
    file: File,
    targetPosition: string
  ): Promise<{
    compressedFile: File;
    previewUrl: string;
    meta: ImageMeta;
  }> => {
    return new Promise((resolve, reject) => {
      const isMain = targetPosition === "HOME_MAIN";
      const maxW = isMain ? 1920 : 1200;
      const maxH = isMain ? 1080 : 800;

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = document.createElement("img");
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const ratio = w / h;

          // Kiểm tra xem tỷ lệ có chuẩn với vị trí hay không
          // HOME_MAIN: chuẩn từ 16:9 (1.77) tới 21:9 (2.33)
          // HOME_SUB: chuẩn từ 16:9 (1.77) tới 2:1 (2.0)
          const isStandardRatio = isMain ? ratio >= 1.7 : ratio >= 1.5;

          // Thu nhỏ kích thước tối đa mà vẫn giữ nguyên tỷ lệ
          if (w > maxW) {
            w = maxW;
            h = Math.round(w / ratio);
          }
          if (h > maxH) {
            h = maxH;
            w = Math.round(h * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Không thể khởi tạo Canvas"));

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);

          // Nén WebP với chất lượng 85%
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Lỗi nén ảnh WebP"));

              const cleanName = file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9_-]/g, "_");
              const compressedFile = new File([blob], `${cleanName}_opt.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              });

              const previewUrl = URL.createObjectURL(blob);
              const reductionPercent = Math.max(
                0,
                Math.round(((file.size - blob.size) / file.size) * 100)
              );

              resolve({
                compressedFile,
                previewUrl,
                meta: {
                  originalSize: file.size,
                  compressedSize: blob.size,
                  width: w,
                  height: h,
                  aspectRatio: ratio,
                  isStandardRatio,
                  reductionPercent,
                },
              });
            },
            "image/webp",
            0.85
          );
        };
        img.onerror = () => reject(new Error("Không thể đọc file hình ảnh"));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Lỗi đọc file từ thiết bị"));
      reader.readAsDataURL(file);
    });
  };

  // 2. Xử lý Upload Ảnh tức thì (kèm nén Canvas Client-Side siêu tốc)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // BƯỚC 1: Nén ảnh Client-side sang định dạng .webp chất lượng 85%
      const { compressedFile, previewUrl, meta } = await compressImage(
        file,
        formData.position
      );

      // Hiển thị Live Preview ngay lập tức 0ms
      setPreviewBlobUrl(previewUrl);
      setImageMeta(meta);

      const origMB = (meta.originalSize / 1024 / 1024).toFixed(1);
      const compKB = (meta.compressedSize / 1024).toFixed(0);
      toast.success(
        `Đã nén tối ưu: ${origMB}MB ➔ ${compKB}KB WebP (tiết kiệm ${meta.reductionPercent}%)!`
      );

      // BƯỚC 2: Upload file WebP đã nén lên Cloudinary
      const uploadData = new FormData();
      uploadData.append("image", compressedFile);

      const token = localStorage.getItem("token");
      const baseURL = api.defaults.baseURL || "";
      const fetchRes = await fetch(`${baseURL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      const data = await fetchRes.json();
      if (data.success && data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        toast.error(`Lỗi máy chủ khi lưu ảnh: ${data.message || ""}`);
      }
    } catch (error: unknown) {
      console.error("Lỗi upload ảnh:", error);
      toast.error("Không thể xử lý và nén ảnh!");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // 3. Mở Modal Thêm mới
  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData(initialForm);
    setImageMeta(null);
    setPreviewBlobUrl("");
    setShowModal(true);
  };

  // 4. Mở Modal Chỉnh sửa
  const openEditModal = (banner: Banner) => {
    setModalMode("edit");
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      link: banner.link || "",
      imageUrl: banner.imageUrl,
      position: banner.position || "HOME_MAIN",
    });
    setPreviewBlobUrl(banner.imageUrl);
    setImageMeta(null); // Sẽ được tự động đo nếu cần
    setShowModal(true);
  };

  // 5. Submit Form (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return toast.error("Vui lòng nhập tên banner!");
    }
    if (!formData.imageUrl) {
      return toast.error("Vui lòng tải lên hoặc chọn ảnh banner!");
    }

    try {
      if (modalMode === "create") {
        const res = await api.post("/api/banners", formData);
        if (res.data.success) {
          toast.success("Thêm banner mới thành công!");
          setShowModal(false);
          fetchBanners();
        }
      } else if (modalMode === "edit" && editingId) {
        const res = await api.put(`/api/banners/${editingId}`, formData);
        if (res.data.success) {
          toast.success("Cập nhật banner thành công!");
          setShowModal(false);
          fetchBanners();
        }
      }
    } catch (error) {
      console.error("Lỗi lưu banner:", error);
      toast.error("Lỗi khi lưu banner, vui lòng thử lại!");
    }
  };

  // 6. Bật/Tắt Banner
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await api.put(`/api/banners/${id}/toggle`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        toast.success(
          !currentStatus ? "Đã BẬT hiển thị banner" : "Đã TẮT hiển thị banner"
        );
        setBanners((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, isActive: !currentStatus } : b
          )
        );
      }
    } catch (error) {
      console.error("Lỗi toggle banner:", error);
      toast.error("Không thể thay đổi trạng thái banner");
    }
  };

  // 7. Xóa Banner
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Xóa banner này?",
      text: "Banner sẽ bị xóa vĩnh viễn khỏi trang chủ.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Có, xóa ngay!",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/api/banners/${id}`);
      if (res.data.success) {
        toast.success("Đã xóa banner thành công!");
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Lỗi xóa banner:", error);
      toast.error("Không thể xóa banner này");
    }
  };

  // Ảnh preview hiện thời (ưu tiên blob mới nén, fallback về formData.imageUrl)
  const activePreviewUrl = previewBlobUrl || formData.imageUrl;

  return (
    <div className="container-fluid p-0">
      {/* HEADER QUẢN LÝ */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-images text-primary fs-3"></i> Quản Lý Banner Quảng Cáo
          </h4>
          <p className="text-muted mb-0 small">
            Quản trị banner chính và banner phụ, tự động nén WebP và mô phỏng Live Preview Desktop
          </p>
        </div>
        <button
          className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-circle"></i> Thêm Banner Mới
        </button>
      </div>

      {/* DANH SÁCH BANNER (GRID RESPONSIVE) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted small">Đang tải danh sách banner...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
          <i className="bi bi-image text-muted" style={{ fontSize: "3rem" }}></i>
          <p className="mt-3 text-muted mb-0">Chưa có banner nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="row g-4">
          {banners.map((banner) => (
            <div key={banner.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                {/* ẢNH BANNER VỚI DUAL-LAYER THẨM MỸ */}
                <div
                  className="position-relative w-100 overflow-hidden bg-light"
                  style={{ paddingTop: "46%" }}
                >
                  {/* Layer Nền Mờ */}
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden"
                    style={{
                      transform: "scale(1.15)",
                      filter: "blur(18px)",
                      opacity: 0.6,
                    }}
                  >
                    <Image
                      src={banner.imageUrl}
                      alt=""
                      fill
                      className="object-fit-cover"
                      unoptimized
                    />
                  </div>

                  {/* Layer Chính */}
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-fit-contain position-relative"
                    style={{ zIndex: 2 }}
                    unoptimized
                  />

                  {/* Overlay Đang Ẩn */}
                  {!banner.isActive && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{ background: "rgba(0,0,0,0.45)", zIndex: 3 }}
                    >
                      <span className="badge bg-secondary px-3 py-2 fs-7 rounded-pill shadow-sm">
                        <i className="bi bi-eye-slash me-1"></i> Đang Ẩn
                      </span>
                    </div>
                  )}
                </div>

                {/* NỘI DUNG CARD */}
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                    <h6 className="card-title fw-bold text-dark text-truncate mb-0">
                      {banner.title}
                    </h6>
                    <span
                      className={`badge rounded-pill flex-shrink-0 px-2 py-1 small fw-semibold ${
                        banner.position === "HOME_MAIN"
                          ? "bg-primary bg-opacity-10 text-primary border border-primary-subtle"
                          : "bg-success bg-opacity-10 text-success border border-success-subtle"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {banner.position === "HOME_MAIN" && "Trang chủ (Chính)"}
                      {banner.position === "HOME_SUB_LEFT" && "Giữa trang (Trái)"}
                      {banner.position === "HOME_SUB_RIGHT" && "Giữa trang (Phải)"}
                    </span>
                  </div>

                  {banner.link ? (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary small text-truncate d-block mb-3"
                      style={{ fontSize: "12px" }}
                    >
                      <i className="bi bi-link-45deg me-1"></i>
                      {banner.link}
                    </a>
                  ) : (
                    <span
                      className="text-muted small d-block mb-3"
                      style={{ fontSize: "12px" }}
                    >
                      Không có link điều hướng
                    </span>
                  )}

                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                    {/* Toggle Switch */}
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input shadow-none cursor-pointer"
                        type="checkbox"
                        role="switch"
                        id={`switch-${banner.id}`}
                        checked={banner.isActive}
                        onChange={() => handleToggleActive(banner.id, banner.isActive)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className={`form-check-label small ms-2 fw-medium ${
                          banner.isActive ? "text-success" : "text-muted"
                        }`}
                        htmlFor={`switch-${banner.id}`}
                        style={{ cursor: "pointer", fontSize: "12px" }}
                      >
                        {banner.isActive ? "Đang Bật" : "Đã Tắt"}
                      </label>
                    </div>

                    {/* Nút Sửa & Xóa */}
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-light text-primary rounded-circle shadow-sm"
                        style={{ width: "32px", height: "32px" }}
                        onClick={() => openEditModal(banner)}
                        title="Chỉnh sửa banner"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-danger rounded-circle shadow-sm"
                        style={{ width: "32px", height: "32px" }}
                        onClick={() => handleDelete(banner.id)}
                        title="Xóa banner"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA BANNER VỚI LIVE PREVIEW & GỢI Ý ĐỘNG */}
      {showModal && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050, backdropFilter: "blur(4px)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <i className="bi bi-aspect-ratio fs-5"></i>
                    </div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      {modalMode === "create" ? "Thêm Banner Quảng Cáo Mới" : "Chỉnh Sửa Banner"}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
                    <div className="col-12 col-md-6">
                      {/* Vị trí hiển thị */}
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-dark mb-1">
                          Vị trí hiển thị <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select rounded-3 shadow-none border-2"
                          value={formData.position}
                          onChange={(e) =>
                            setFormData({ ...formData, position: e.target.value })
                          }
                          required
                        >
                          <option value="HOME_MAIN">Trang chủ (Banner Chính to)</option>
                          <option value="HOME_SUB_LEFT">Banner giữa trang (Trái)</option>
                          <option value="HOME_SUB_RIGHT">Banner giữa trang (Phải)</option>
                        </select>
                      </div>

                      {/* Tên Banner */}
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-dark mb-1">
                          Tên Banner (Tiêu đề) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control rounded-3 shadow-none border-2"
                          placeholder="VD: Khuyến mãi Cáp CADIVI 2026..."
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                        />
                      </div>

                      {/* Link điều hướng */}
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-dark mb-1">
                          Link điều hướng (Tùy chọn)
                        </label>
                        <input
                          type="url"
                          className="form-control rounded-3 shadow-none border-2"
                          placeholder="VD: /category/day-dien hoặc https://..."
                          value={formData.link}
                          onChange={(e) =>
                            setFormData({ ...formData, link: e.target.value })
                          }
                        />
                        <div className="form-text small" style={{ fontSize: "11px" }}>
                          Đường dẫn trang khi người mua click vào banner.
                        </div>
                      </div>

                      {/* GỢI Ý KÍCH THƯỚC ĐỘNG (CONTEXTUAL GUIDE) */}
                      {formData.position === "HOME_MAIN" ? (
                        <div
                          className="rounded-3 p-3 border mb-3"
                          style={{ backgroundColor: "#F0F7FF", borderColor: "#BFDBFE" }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-1 text-primary fw-bold small">
                            <i className="bi bi-lightbulb-fill text-warning fs-5"></i>
                            Gợi ý Banner Chính (HOME_MAIN)
                          </div>
                          <div className="text-dark small" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                            &bull; <strong>Tỷ lệ khuyến nghị:</strong> 21:9 hoặc 16:9<br />
                            &bull; <strong>Chuẩn nét nhất:</strong> 1920x820px hoặc 1920x1080px<br />
                            &bull; <strong>Chống vỡ trang:</strong> Tự động kích hoạt hiệu ứng Dual-Layer Blur nếu tải ảnh vuông.
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-3 p-3 border mb-3"
                          style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-1 text-success fw-bold small">
                            <i className="bi bi-lightbulb-fill text-warning fs-5"></i>
                            Gợi ý Banner Giữa Trang ({formData.position === "HOME_SUB_LEFT" ? "Trái" : "Phải"})
                          </div>
                          <div className="text-dark small" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                            &bull; <strong>Tỷ lệ khuyến nghị:</strong> 16:9 hoặc 2:1<br />
                            &bull; <strong>Chuẩn nét nhất:</strong> 800x450px hoặc 800x400px<br />
                            &bull; <strong>Hiển thị:</strong> Cặp đôi song song làm nổi bật thương hiệu CADIVI, Bình Minh, Panasonic.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CỘT PHẢI: KHUNG LIVE PREVIEW THÔNG MINH (DUAL-LAYER SIMULATION) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-dark mb-1 d-flex justify-content-between align-items-center">
                        <span>
                          <i className="bi bi-laptop me-1 text-primary"></i> Mô Phỏng Hiển Thị Desktop
                        </span>
                        {imageMeta && (
                          <span
                            className={`badge rounded-pill small ${
                              imageMeta.isStandardRatio
                                ? "bg-success bg-opacity-10 text-success border border-success-subtle"
                                : "bg-info bg-opacity-15 text-primary border border-info-subtle"
                            }`}
                            style={{ fontSize: "10.5px" }}
                          >
                            {imageMeta.isStandardRatio
                              ? "✅ Tỷ lệ chuẩn"
                              : "⚡ Kích hoạt Dual-Layer"}
                          </span>
                        )}
                      </label>

                      {/* Khung Mô Phỏng Màn Hình Trình Duyệt Desktop */}
                      <div className="card border rounded-4 overflow-hidden shadow-sm bg-white">
                        {/* Thanh Top-Bar Giả Lập Browser */}
                        <div
                          className="bg-light px-3 py-1 border-bottom d-flex align-items-center justify-content-between"
                          style={{ fontSize: "10px" }}
                        >
                          <div className="d-flex gap-1">
                            <span
                              className="rounded-circle d-inline-block"
                              style={{ width: "8px", height: "8px", backgroundColor: "#ff5f56" }}
                            ></span>
                            <span
                              className="rounded-circle d-inline-block"
                              style={{ width: "8px", height: "8px", backgroundColor: "#ffbd2e" }}
                            ></span>
                            <span
                              className="rounded-circle d-inline-block"
                              style={{ width: "8px", height: "8px", backgroundColor: "#27c93f" }}
                            ></span>
                          </div>
                          <span className="text-muted font-monospace">truongtin.vn &bull; Desktop Preview</span>
                          <span className="opacity-0">...</span>
                        </div>

                        {/* Vùng Container Hiển Thị Banner với Tỷ Lệ Thực Tế */}
                        <div
                          className="position-relative w-100 overflow-hidden bg-light d-flex align-items-center justify-content-center"
                          style={{
                            height: formData.position === "HOME_MAIN" ? "210px" : "180px",
                          }}
                        >
                          {activePreviewUrl ? (
                            <>
                              {/* ẢNH PREVIEW SẮC NÉT TRÀN KHUNG (COVER) */}
                              <Image
                                src={activePreviewUrl}
                                alt="Live Preview"
                                fill
                                className="object-fit-cover rounded-3"
                                unoptimized
                              />

                              {/* NÚT XÓA ẢNH ĐỂ CHỌN LẠI */}
                              <button
                                type="button"
                                className="btn btn-sm btn-dark bg-opacity-75 position-absolute top-0 end-0 m-2 rounded-circle shadow-sm border-0"
                                style={{ zIndex: 5, width: "30px", height: "30px" }}
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, imageUrl: "" }));
                                  setPreviewBlobUrl("");
                                  setImageMeta(null);
                                }}
                                title="Xóa ảnh để chọn lại"
                              >
                                <i className="bi bi-x-lg text-white small"></i>
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-3 text-muted">
                              {isUploading ? (
                                <>
                                  <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
                                  <div className="small fw-bold">Đang nén & tải ảnh lên...</div>
                                  <div className="text-muted" style={{ fontSize: "11px" }}>
                                    Tự động chuyển định dạng WebP 85%
                                  </div>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-cloud-arrow-up fs-1 text-primary opacity-50"></i>
                                  <div className="small fw-bold text-dark mt-2">
                                    Chưa có hình ảnh banner
                                  </div>
                                  <div className="text-muted" style={{ fontSize: "11.5px" }}>
                                    Nhấp vào nút bên dưới để chọn ảnh từ máy
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* THANH PHÂN TÍCH ẢNH (IMAGE ANALYTICS PILL BAR) */}
                        {imageMeta && (
                          <div
                            className="p-2 border-top bg-light d-flex justify-content-between align-items-center"
                            style={{ fontSize: "11px" }}
                          >
                            <span className="text-muted">
                              <i className="bi bi-arrows-fullscreen me-1"></i>
                              <strong>{imageMeta.width}x{imageMeta.height}px</strong>
                            </span>
                            <span className="text-success fw-bold">
                              <i className="bi bi-speedometer2 me-1"></i>
                              {(imageMeta.originalSize / 1024 / 1024).toFixed(1)}MB ➔{" "}
                              {(imageMeta.compressedSize / 1024).toFixed(0)}KB WebP
                            </span>
                          </div>
                        )}
                      </div>

                      {/* NÚT TẢI / CHỌN ẢNH VÀ NÉN CANVAS TỰ ĐỘNG */}
                      <div className="mt-3">
                        <button
                          type="button"
                          className="btn btn-outline-primary rounded-3 w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <i className="bi bi-upload"></i>
                          {activePreviewUrl ? "Chọn Đổi Ảnh Khác" : "Tải Lên & Nén Ảnh Tự Động"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        <div
                          className="text-muted text-center mt-1"
                          style={{ fontSize: "11px" }}
                        >
                          Hỗ trợ JPG, PNG, WEBP. Ảnh tự động nén dưới 300KB chuẩn nét không làm lag trang.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 border fw-medium"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-5 shadow-sm fw-bold"
                    disabled={isUploading || !formData.imageUrl || !formData.title.trim()}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Đang tải...
                      </>
                    ) : modalMode === "create" ? (
                      "Lưu Banner"
                    ) : (
                      "Cập Nhật Banner"
                    )}
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
