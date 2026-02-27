"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Image from "next/image";

// --- Interface ---
interface Category {
  id: number;
  name: string;
}

interface VariantForm {
  sku: string;
  price: string;
  stock: string;
  attributeValue: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  unit: string;
  categoryId: number;
  category: { name: string };
  variants: {
    sku: string;
    price: number;
    stock: number;
    attributeValue: string;
    name: string;
  }[];
  images: { url: string }[];
}

// --- Helpers ---
const generateSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const formatMoney = (value: string | number) => {
  if (value === 0 || value === "0") return "0";
  if (!value) return "";
  const num = value.toString().replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const cleanMoney = (value: string) => {
  return value.replace(/\./g, "");
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Phân trang
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // --- ĐÃ THÊM: State quản lý trạng thái đang upload ảnh ---
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const initialFormState = {
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    unit: "Cái",
    images: [] as string[], // Đổi thành mảng rỗng mặc định
    variants: [
      { sku: "", price: "", stock: "", attributeValue: "" },
    ] as VariantForm[],
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get(`/api/products?page=${page}&limit=12`),
        api.get("/api/categories"),
      ]);
      setProducts(prodRes.data.data);
      setPagination(prodRes.data.pagination);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success("Đã xóa");
      fetchData(pagination.currentPage);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditId(p.id);
    setFormData({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      unit: p.unit || "Cái",
      categoryId: p.categoryId.toString(),
      images: p.images.length > 0 ? p.images.map((img) => img.url) : [],
      variants: p.variants.map((v) => ({
        sku: v.sku,
        price: v.price.toString(),
        stock: v.stock.toString(),
        attributeValue: v.name || "",
      })),
    });
    setShowModal(true);
  };

  // --- ĐÃ THÊM: Logic Upload ảnh trực tiếp lên Cloudinary ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const uploadedUrls: string[] = [];

    // Lặp qua từng file người dùng chọn để upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = new FormData();
      data.append("file", file);

      data.append("upload_preset", "truongtin_images");
      data.append("cloud_name", "dwqbfdxpm");

      try {
        // Gọi API của Cloudinary (Nhớ đổi cloud_name trên link)
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dwqbfdxpm/image/upload",
          {
            method: "POST",
            body: data,
          },
        );
        const result = await res.json();

        if (result.secure_url) {
          uploadedUrls.push(result.secure_url);
        }
      } catch (error) {
        console.error("Lỗi upload:", error);
        toast.error(`Lỗi upload ảnh: ${file.name}`);
      }
    }

    // Cập nhật lại state formData, gộp ảnh cũ và ảnh mới upload
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));

    setIsUploadingImage(false);
    // Reset input file để có thể chọn lại file vừa chọn nếu cần
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.slug) payload.slug = generateSlug(payload.name);

    // Đảm bảo không gửi mảng rỗng lên nếu bị lỗi
    payload.images = payload.images.filter((url) => url.trim() !== "");

    try {
      if (editId) {
        await api.put(`/api/products/${editId}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/api/products", payload);
        toast.success("Thêm thành công");
      }
      setShowModal(false);
      fetchData(pagination.currentPage);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi lưu sản phẩm");
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex justify-content-between mb-4 align-items-center">
        <div>
          <h5 className="fw-bold mb-0">Hàng Hóa Trường Tín</h5>
          <small className="text-muted">Quản lý kho và giá bán</small>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary rounded-pill px-4"
        >
          + Thêm Sản Phẩm
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>ĐVT</th>
              <th>Tổng Kho</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-5">
                  Đang tải...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  Chưa có sản phẩm nào
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <Image
  src={
    p.images?.[0]?.url ||
    "https://placehold.co/40x40?text=No+Img"
  }
  alt={p.name}
  width={40}
  height={40}
  className="rounded me-2 object-fit-cover border"
  style={{ objectFit: "cover" }}
/>
                      <div>
                        <div className="fw-bold">{p.name}</div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "10px" }}
                        >
                          {p.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">
                      {p.category?.name}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary border">
                      {p.unit || "Cái"}
                    </span>
                  </td>
                  <td>
                    {p.variants?.reduce((acc, v) => acc + v.stock, 0) || 0}
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => openEditModal(p)}
                      className="btn btn-sm btn-light text-primary me-2 rounded-circle"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-sm btn-light text-danger rounded-circle"
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

      {/* Điều hướng phân trang (Pagination UI) */}
      {!loading && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination pagination-sm">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <li
                  key={i}
                  className={`page-item ${pagination.currentPage === i + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => fetchData(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="modal d-block"
          style={{
            background: "rgba(0,0,0,0.5)",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 rounded-4 shadow p-3">
              <form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">
                    {editId ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="small fw-bold mb-1">Tên sản phẩm</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ống nhựa Bình Minh..."
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="small fw-bold mb-1">Danh mục</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="small fw-bold mb-1 text-danger">
                      Đơn vị tính
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      placeholder="Cây, Cuộn, Cái..."
                      required
                    />
                  </div>

                  <div className="col-12 bg-light p-3 rounded-3 mt-4 border">
                    <div className="d-flex justify-content-between mb-3 align-items-center">
                      <span className="fw-bold text-primary">
                        Phân loại & Báo giá
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-pill px-3"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            variants: [
                              ...formData.variants,
                              {
                                sku: "",
                                price: "",
                                stock: "",
                                attributeValue: "",
                              },
                            ],
                          })
                        }
                      >
                        + Thêm kích cỡ
                      </button>
                    </div>

                    {formData.variants.map((v, i) => (
                      <div
                        key={i}
                        className="row g-2 mb-2 align-items-center bg-white p-2 rounded shadow-sm border"
                      >
                        <div className="col-md-4">
                          <label
                            className="small text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            Tên quy cách (Tùy chọn)
                          </label>
                          <input
                            type="text"
                            placeholder="Phi 21, 1.5mm..."
                            className="form-control form-control-sm border-primary"
                            value={v.attributeValue}
                            onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[i].attributeValue = e.target.value;
                              setFormData({ ...formData, variants: newV });
                            }}
                          />
                        </div>
                        <div className="col-md-3">
                          <label
                            className="small text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            Giá bán (VNĐ)
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm text-danger fw-bold"
                            value={formatMoney(v.price)}
                            onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[i].price = cleanMoney(e.target.value);
                              setFormData({ ...formData, variants: newV });
                            }}
                            required
                          />
                        </div>
                        <div className="col-md-2">
                          <label
                            className="small text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            Số lượng
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={v.stock}
                            onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[i].stock = e.target.value;
                              setFormData({ ...formData, variants: newV });
                            }}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <label
                            className="small text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            SKU (Tùy chọn)
                          </label>
                          <div className="d-flex gap-1">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={v.sku}
                              onChange={(e) => {
                                const newV = [...formData.variants];
                                newV[i].sku = e.target.value;
                                setFormData({ ...formData, variants: newV });
                              }}
                            />
                            {formData.variants.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    variants: formData.variants.filter(
                                      (_, idx) => idx !== i,
                                    ),
                                  })
                                }
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* --- ĐÃ SỬA LẠI: Giao diện Upload File & Preview --- */}
                  <div className="col-12 bg-light p-3 rounded-3 mt-3 border">
                    <div className="d-flex justify-content-between mb-3 align-items-center">
                      <span className="fw-bold text-success">
                        Hình ảnh sản phẩm
                      </span>

                      {/* Nút ẩn input file, chỉ hiện label cho đẹp */}
                      <div>
                        <input
                          type="file"
                          id="upload-image"
                          multiple
                          accept="image/*"
                          className="d-none"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                        />
                        <label
                          htmlFor="upload-image"
                          className={`btn btn-sm btn-success rounded-pill px-3 m-0 ${isUploadingImage ? "disabled" : ""}`}
                          style={{ cursor: "pointer" }}
                        >
                          {isUploadingImage ? (
                            <span>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang tải...
                            </span>
                          ) : (
                            "+ Chọn ảnh từ máy"
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Khu vực hiển thị ảnh đã upload */}
                    <div className="d-flex flex-wrap gap-3">
                      {formData.images.map((url, i) => (
                        <div
                          key={i}
                          className="position-relative border p-1 bg-white rounded shadow-sm"
                        >
                          <img
                            src={url}
                            alt={`preview-${i}`}
                            width="80"
                            height="80"
                            className="object-fit-cover rounded"
                          />
                          {/* Nút xóa ảnh */}
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle shadow"
                            style={{
                              width: "24px",
                              height: "24px",
                              padding: 0,
                              lineHeight: "10px",
                            }}
                            onClick={() => removeImage(i)}
                          >
                            <i
                              className="bi bi-x"
                              style={{ fontSize: "14px" }}
                            ></i>
                          </button>
                        </div>
                      ))}

                      {formData.images.length === 0 && !isUploadingImage && (
                        <span className="text-muted small">
                          Chưa có ảnh nào được tải lên.
                        </span>
                      )}
                    </div>
                  </div>
                  {/* --- KẾT THÚC PHẦN SỬA --- */}
                </div>

                <div className="text-end mt-4 pt-3 border-top">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-light me-2 rounded-pill px-4 border"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger rounded-pill px-5 shadow"
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? "Đang xử lý ảnh..." : "Lưu Sản Phẩm"}
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
