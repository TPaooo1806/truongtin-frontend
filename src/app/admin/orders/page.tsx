"use client";
import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import Swal from "sweetalert2";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA INTERFACE ---
interface Product {
  name: string;
}

interface Variant {
  name?: string;
  sku?: string;
  product?: Product;
}

interface OrderItem {
  id: number;
  productName: string;
  variantId: number;
  quantity: number;
  price: number;
  variant?: Variant;
}

interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items?: OrderItem[];
}

interface BackendResponse {
  success: boolean;
  data: Order[];
  message?: string;
  totalOrders: number;
  totalPages: number;
  currentPage: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // --- FILTERS STATE ---
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("ALL"); 
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Đếm số lượng bộ lọc đang được kích hoạt (khác ALL hoặc có từ khóa)
  const activeFiltersCount = 
    (filterStatus !== "ALL" ? 1 : 0) +
    (filterPaymentStatus !== "ALL" ? 1 : 0) +
    (filterPaymentMethod !== "ALL" ? 1 : 0) +
    (searchKeyword.trim() ? 1 : 0);

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterPaymentStatus("ALL");
    setFilterPaymentMethod("ALL");
    setSearchKeyword("");
    fetchOrders(1);
  };

  // --- 2. HÀM LẤY DỮ LIỆU ---
  const fetchOrders = async (page: number = 1) => {
    if (page > 1) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: filterStatus,
        paymentStatus: filterPaymentStatus,
        paymentMethod: filterPaymentMethod
      });
      if (searchKeyword.trim()) queryParams.append("search", searchKeyword.trim());

      const res = await api.get<BackendResponse>(
        `/api/orders/admin/all?${queryParams.toString()}`,
      );

      if (res.data.success) {
        if (page === 1) {
          setOrders(res.data.data);
        } else {
          setOrders((prev) => [...prev, ...res.data.data]);
        }
        setCurrentPage(res.data.currentPage);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchOrders(currentPage + 1);
    }
  };

  // --- 3. HÀM DUYỆT ĐƠN ---
  const handleApprove = async (orderId: number, orderCode: string) => {
    const result = await Swal.fire({
      title: "Xác nhận duyệt đơn?",
      text: `Bạn có chắc chắn muốn duyệt đơn #${orderCode}? Hệ thống sẽ thực hiện trừ kho.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/api/orders/approve/${orderId}`,
        {},
      );

      if (res.data.success) {
        toast.success("Duyệt đơn thành công, kho đã được cập nhật!");
        fetchOrders();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || "Lỗi khi duyệt đơn");
    }
  };

  // --- 4. HÀM HỦY ĐƠN ---
  const handleCancel = async (orderId: number, orderCode: string) => {
    const result = await Swal.fire({
      title: "Hủy đơn hàng?",
      text: `Bạn có chắc muốn hủy đơn #${orderCode}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, hủy đơn!",
      cancelButtonText: "Quay lại",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/api/orders/cancel/${orderId}`,
      );

      if (res.data.success) {
        toast.success("Đã huỷ đơn");
        fetchOrders();
      }
    } catch {
      toast.error("Không thể huỷ đơn");
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/api/orders/admin/status/${orderId}`,
        { status: newStatus },
      );
      if (res.data.success) {
        toast.success("Cập nhật trạng thái thành công");
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchOrders(currentPage);
      }
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    const result = await Swal.fire({
      title: "Xác nhận thu tiền?",
      text: "Đã thu đủ tiền mặt (COD) thành công? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f5b041",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Đã thu tiền",
      cancelButtonText: "Đóng",
    });

    if (!result.isConfirmed) return;
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/api/orders/admin/payment-status/${orderId}`,
      );
      if (res.data.success) {
        toast.success("Xác nhận thu tiền thành công");
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: "PAID" });
        }
        fetchOrders(currentPage);
      }
    } catch {
      toast.error("Lỗi xác nhận thu tiền");
    }
  };

  // --- 5. LẤY PHƯƠNG THỨC THANH TOÁN ---
  const getPaymentMethod = (paymentMethod: string) => {
    if (paymentMethod === "PAYOS") return "Thanh toán QR (PayOS)";
    if (paymentMethod === "COD") return "Thanh toán khi nhận hàng (COD)";
    return "Không xác định";
  };

  // --- 6. BADGE TRẠNG THÁI THANH TOÁN ---
  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "UNPAID":
        return (
          <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">
            Chưa thanh toán
          </span>
        );
      case "PAID":
        return (
          <span className="badge bg-success text-white px-2 py-1 rounded-pill">
            Đã thanh toán
          </span>
        );
      case "CANCELLED":
      case "EXPIRED":
        return (
          <span className="badge bg-danger text-white px-2 py-1 rounded-pill">
            Đã hủy/Hết hạn
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">
            {paymentStatus}
          </span>
        );
    }
  };

  // --- 7. BADGE TRẠNG THÁI ĐƠN HÀNG ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_COD":
      case "PENDING_PAYOS":
        return (
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
            <i className="bi bi-hourglass-split me-1"></i> Chờ duyệt
          </span>
        );
      case "PAID_PENDING_CONFIRM":
        return (
          <span className="badge bg-primary text-white px-3 py-2 rounded-pill shadow-sm">
            <i className="bi bi-credit-card me-1"></i> Đã thanh toán
          </span>
        );
      case "PAID_AND_CONFIRMED":
        return (
          <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm">
            <i className="bi bi-check-circle-fill me-1"></i> Đã duyệt & Trừ kho
          </span>
        );
      case "CANCELLED":
        return (
          <span className="badge bg-danger text-white px-3 py-2 rounded-pill shadow-sm">
            <i className="bi bi-x-circle-fill me-1"></i> Đã hủy
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary px-3 py-2 rounded-pill shadow-sm">
            {status}
          </span>
        );
    }
  };

  if (loading)
    return <div className="text-center p-5 fw-bold">Đang tải đơn hàng...</div>;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <div>
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>Quản Lý Đơn Hàng</h5>
          <span className="text-muted small d-none d-md-block">
            Xem chi tiết và xác nhận trừ kho
          </span>
        </div>
      </div>

      {/* 1. BỘ LỌC CHO DESKTOP (≥ 768px): GIỮ NGUYÊN */}
      <div className="row g-2 mb-4 bg-light p-3 rounded-3 mx-0 border d-none d-md-flex">
        <div className="col-12 col-md-3">
          <input 
            type="text" 
            className="form-control shadow-sm" 
            placeholder="Tìm mã đơn, SĐT, Tên KH..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
          />
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select shadow-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Mọi trạng thái</option>
            <option value="PENDING_COD">Chờ duyệt COD</option>
            <option value="PENDING_PAYOS">Chờ duyệt PayOS</option>
            <option value="PAID_PENDING_CONFIRM">Đã TT (Chờ duyệt)</option>
            <option value="PAID_AND_CONFIRMED">Đã duyệt & Trừ kho</option>
            <option value="PROCESSING">Đang soạn hàng</option>
            <option value="SHIPPING">Đang giao hàng</option>
            <option value="DELIVERED">Đã giao hàng</option>
            <option value="RETURNED">Đã hoàn trả</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select shadow-sm text-primary fw-bold" value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}>
            <option value="ALL">Lịch sử (Tất cả Hóa Đơn)</option>
            <option value="UNPAID">Chỉ đơn Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán thành công</option>
            <option value="CANCELLED">Đã hủy / Quá giờ</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select shadow-sm" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}>
            <option value="ALL">Kiểu TT</option>
            <option value="COD">Tiền mặt (COD)</option>
            <option value="PAYOS">Chuyển khoản (PayOS)</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <button className="btn btn-danger w-100 fw-bold shadow-sm" onClick={() => fetchOrders(1)}>
            <i className="bi bi-funnel-fill me-2"></i>Lọc Đơn
          </button>
        </div>
      </div>

      {/* 2. BỘ LỌC CHO MOBILE (< 768px): GỌI GỌN 1 HÀNG + TOGGLE NÂNG CAO */}
      <div className="d-block d-md-none mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative flex-grow-1">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 pe-3 py-1.5 shadow-none bg-light" 
              style={{ fontSize: '14px' }}
              placeholder="Tìm mã đơn, SĐT, Tên KH..." 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
            />
          </div>
          <button 
            type="button"
            className={`btn rounded-pill px-3 py-1.5 d-flex align-items-center gap-1 flex-shrink-0 ${showMobileFilters || activeFiltersCount > 0 ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '13px' }}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <i className="bi bi-funnel"></i>
            <span>Lọc</span>
            {activeFiltersCount > 0 && (
              <span className="badge bg-white text-primary rounded-circle ms-1 p-1" style={{ fontSize: '10px', minWidth: '16px' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Khung xổ ra bộ lọc nâng cao khi ấn nút Lọc trên mobile */}
        {showMobileFilters && (
          <div className="p-3 bg-light rounded-3 mt-2 border shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold small text-secondary">Tùy Chọn Lọc Nâng Cao</span>
              {activeFiltersCount > 0 && (
                <button type="button" className="btn btn-link btn-sm p-0 text-danger text-decoration-none" style={{ fontSize: '12px' }} onClick={resetFilters}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <div className="d-flex flex-column gap-2">
              <div>
                <label className="form-label text-muted mb-1" style={{ fontSize: '11px' }}>Trạng Thái Đơn</label>
                <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="PENDING_COD">Chờ duyệt COD</option>
                  <option value="PENDING_PAYOS">Chờ duyệt PayOS</option>
                  <option value="PAID_PENDING_CONFIRM">Đã TT (Chờ duyệt)</option>
                  <option value="PAID_AND_CONFIRMED">Đã duyệt & Trừ kho</option>
                  <option value="PROCESSING">Đang soạn hàng</option>
                  <option value="SHIPPING">Đang giao hàng</option>
                  <option value="DELIVERED">Đã giao hàng</option>
                  <option value="RETURNED">Đã hoàn trả</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div>
                <label className="form-label text-muted mb-1" style={{ fontSize: '11px' }}>Trạng Thái Thanh Toán</label>
                <select className="form-select form-select-sm" value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}>
                  <option value="ALL">Tất cả thanh toán</option>
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="CANCELLED">Đã hủy / Hết hạn</option>
                </select>
              </div>
              <div>
                <label className="form-label text-muted mb-1" style={{ fontSize: '11px' }}>Phương Thức</label>
                <select className="form-select form-select-sm" value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}>
                  <option value="ALL">Tất cả phương thức</option>
                  <option value="COD">Tiền mặt (COD)</option>
                  <option value="PAYOS">Chuyển khoản (PayOS)</option>
                </select>
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm rounded-pill mt-2 fw-semibold"
                onClick={() => {
                  fetchOrders(1);
                  setShowMobileFilters(false);
                }}
              >
                Áp Dụng Bộ Lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. BẢNG DÀNH CHO DESKTOP (≥ 768px): GIỮ NGUYÊN BẢNG HIỆN TẠI */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">Mã Đơn</th>
              <th className="border-0">Khách Hàng</th>
              <th className="border-0">Ngày Đặt</th>
              <th className="border-0">Tổng Tiền</th>
              <th className="border-0">Thanh Toán</th>
              <th className="border-0">Trạng Thái</th>
              <th className="text-end pe-3 border-0 rounded-end-3">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="ps-3 fw-bold text-primary">
                  #{order.orderCode}
                </td>
                <td>
                  <div className="fw-bold text-dark">{order.customerName}</div>
                  <div className="text-muted small">{order.phone}</div>
                </td>
                <td className="text-secondary">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="fw-bold text-danger">
                  {order.total.toLocaleString()}đ
                </td>
                <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td className="text-end pe-3">
                  <button
                    className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-2"
                    onClick={() => setSelectedOrder(order)}
                    title="Xem chi tiết"
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>

                  {order.status !== "PAID_AND_CONFIRMED" &&
                    order.status !== "CANCELLED" && (
                      <>
                        <button
                          className="btn btn-sm btn-success rounded-circle shadow-sm"
                          onClick={() =>
                            handleApprove(order.id, order.orderCode)
                          }
                          title="Duyệt đơn"
                        >
                          <i className="bi bi-check-lg text-white"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-danger rounded-circle shadow-sm ms-2"
                          onClick={() =>
                            handleCancel(order.id, order.orderCode)
                          }
                          title="Hủy đơn"
                        >
                          <i className="bi bi-x-lg text-white"></i>
                        </button>
                      </>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center p-4 text-muted">
            Không có đơn hàng nào.
          </div>
        )}
      </div>

      {/* 4. COMPACT LIST DÀNH CHO MOBILE (< 768px): KHÔNG CUỘN NGANG */}
      <div className="d-block d-md-none">
        {orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-1 text-secondary opacity-50"></i>
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="border rounded-3 p-3 bg-white shadow-sm"
              >
                {/* Dòng 1: Mã đơn & Trạng thái */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-primary" style={{ fontSize: '14px' }}>
                    #{order.orderCode}
                  </span>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Dòng 2: Tên khách hàng & Ngày đặt */}
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '14px' }}>
                  {order.customerName}
                </div>
                <div className="text-muted mb-2" style={{ fontSize: '12px' }}>
                  <i className="bi bi-telephone me-1"></i>{order.phone} • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </div>

                {/* Dòng 3: Tổng tiền & Nút thao tác */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div>
                    <div className="fw-bold text-danger fs-6">
                      {order.total.toLocaleString()}đ
                    </div>
                    <div className="mt-0.5">{getPaymentStatusBadge(order.paymentStatus)}</div>
                  </div>

                  <div className="d-flex align-items-center gap-1.5">
                    <button
                      className="btn btn-sm btn-light text-primary rounded-circle shadow-sm"
                      onClick={() => setSelectedOrder(order)}
                      style={{ width: '34px', height: '34px' }}
                      title="Xem chi tiết"
                    >
                      <i className="bi bi-eye-fill"></i>
                    </button>

                    {order.status !== "PAID_AND_CONFIRMED" &&
                      order.status !== "CANCELLED" && (
                        <>
                          <button
                            className="btn btn-sm btn-success rounded-circle shadow-sm ms-1"
                            onClick={() =>
                              handleApprove(order.id, order.orderCode)
                            }
                            style={{ width: '34px', height: '34px' }}
                            title="Duyệt đơn"
                          >
                            <i className="bi bi-check-lg text-white"></i>
                          </button>

                          <button
                            className="btn btn-sm btn-danger rounded-circle shadow-sm ms-1"
                            onClick={() =>
                              handleCancel(order.id, order.orderCode)
                            }
                            style={{ width: '34px', height: '34px' }}
                            title="Hủy đơn"
                          >
                            <i className="bi bi-x-lg text-white"></i>
                          </button>
                        </>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOAD MORE BUTTON */}
      {currentPage < totalPages && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary rounded-pill px-4"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                Đang tải...
              </>
            ) : (
              "Xem thêm đơn hàng"
            )}
          </button>
        </div>
      )}

      {/* MODAL CHI TIẾT */}
      {selectedOrder && (
        <div
          className="modal d-block shadow-lg"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title fw-bold">
                  Chi tiết đơn hàng #{selectedOrder.orderCode}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="row mb-4 p-3 bg-light rounded-3 mx-0">
                  <div className="col-12 col-md-6 mb-3 mb-md-0">
                    <p className="mb-1 text-muted small text-uppercase fw-bold">
                      Giao đến
                    </p>
                    <p className="mb-0 fw-bold">{selectedOrder.customerName}</p>
                    <p className="mb-0 text-secondary small">
                      {selectedOrder.phone}
                    </p>
                    <p className="mb-0 text-secondary small">
                      {selectedOrder.address}
                    </p>
                  </div>
                  <div className="col-12 col-md-6 text-md-end">
                    <p className="mb-1 text-muted small text-uppercase fw-bold">
                      Thời gian đặt
                    </p>
                    <p className="mb-1">
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        "vi-VN",
                      )}
                    </p>
                    <div className="mb-3">
                      {getStatusBadge(selectedOrder.status)}
                    </div>

                    <p className="mb-1 text-muted small text-uppercase fw-bold">
                      Trạng thái thanh toán
                    </p>
                    <div className="mb-3">
                      {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                    </div>

                    <p className="mb-1 text-muted small text-uppercase fw-bold">
                      Phương thức thanh toán
                    </p>
                    <p className="fw-bold text-primary">
                      {getPaymentMethod(selectedOrder.paymentMethod)}
                    </p>
                  </div>
                </div>

                <p className="mb-2 text-dark fw-bold">
                  <i className="bi bi-box-seam me-2"></i>Sản phẩm đã chọn
                </p>
                <div className="table-responsive border rounded-3 shadow-sm mb-3">
                  <table className="table table-borderless mb-0">
                    <thead className="bg-light border-bottom">
                      <tr className="small text-muted">
                        <th className="ps-3 py-2">Sản phẩm</th>
                        <th className="text-center py-2">SL</th>
                        <th className="text-end pe-3 py-2">Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="border-bottom align-middle">
                          <td className="ps-3 py-3">
                            <div className="fw-bold">
                              {item.variant?.product?.name || "Sản phẩm"}
                            </div>
                            <div className="text-muted x-small">
                              Tên sản phẩm: {item.productName || "N/A"}
                            </div>
                          </td>
                          <td className="text-center">x{item.quantity}</td>
                          <td className="text-end pe-3 fw-bold">
                            {(item.price || 0).toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light border-top">
                      <tr>
                        <td colSpan={2} className="ps-3 py-3 fw-bold text-dark">
                          Tổng tiền
                        </td>
                        <td className="text-end pe-3 py-3 fw-bold text-danger fs-5">
                          {selectedOrder.total.toLocaleString()}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-0 p-3 d-flex justify-content-between align-items-center bg-light rounded-bottom-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold small text-muted text-uppercase">
                    Cập nhật tiến độ:
                  </span>
                  <select
                    className="form-select form-select-sm w-auto fw-semibold border-primary text-primary"
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedOrder.id, e.target.value)
                    }
                  >
                    <option value="PENDING_COD">Chờ duyệt (COD)</option>
                    <option value="PENDING_PAYOS">Chờ duyệt (PayOS)</option>
                    <option value="PAID_PENDING_CONFIRM">
                      Đã TT (Chờ duyệt)
                    </option>
                    <option value="PAID_AND_CONFIRMED">
                      Đã duyệt & Trừ kho
                    </option>
                    <option value="PROCESSING">Đang soạn hàng</option>
                    <option value="SHIPPING">Đang giao hàng</option>
                    <option value="DELIVERED">Đã giao hàng</option>
                    <option value="RETURNED">Đã hoàn trả</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>

                <div className="d-flex gap-2">
                  {selectedOrder.paymentMethod === "COD" &&
                    selectedOrder.paymentStatus === "UNPAID" && (
                      <button
                        className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm"
                        onClick={() => handleConfirmPayment(selectedOrder.id)}
                      >
                        <i className="bi bi-cash-coin me-1"></i> Xác nhận đã thu
                        tiền
                      </button>
                    )}
                  <button
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
