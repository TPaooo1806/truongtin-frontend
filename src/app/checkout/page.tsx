"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import api from "@/lib/axios";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface LocationData {
  id: string;
  full_name: string;
}
interface CartItem {
  productId: number;
  productName: string;
  slug: string;
  image: string;
  variantId: number;
  price: number;
  quantity: number;
  unit: string;
}
interface AddressState {
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
  detail: string;
}
interface CustomerInfo {
  fullName: string;
  phone: string;
}
type FormErrors = Partial<
  Record<keyof CustomerInfo | keyof AddressState, string>
>;

// ==========================================
// 2. CONSTANTS & VALIDATION HELPERS
// ==========================================
const PHONE_REGEX = /^0[35789]\d{8}$/;

const validateCheckoutForm = (
  customer: CustomerInfo,
  address: AddressState,
): FormErrors => {
  const errors: FormErrors = {};

  if (!customer.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
  if (!PHONE_REGEX.test(customer.phone))
    errors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu 03, 05, 07, 08, 09)";

  if (!address.provinceId) errors.provinceId = "Vui lòng chọn Tỉnh/Thành phố";
  if (!address.districtId) errors.districtId = "Vui lòng chọn Quận/Huyện";
  if (!address.detail.trim()) errors.detail = "Vui lòng nhập địa chỉ cụ thể";

  return errors;
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function CheckoutPage() {
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true); 

  const [cartItems, setCartItems] = useState<CartItem[]>([]); 
  const [provinces, setProvinces] = useState<LocationData[]>([]);
  const [districts, setDistricts] = useState<LocationData[]>([]);
  const [wards, setWards] = useState<LocationData[]>([]);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    phone: "",
  });
  const [selectedAddress, setSelectedAddress] = useState<AddressState>({
    provinceId: "", provinceName: "", districtId: "", districtName: "", wardId: "", wardName: "", detail: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart) as CartItem[]);
      }
    });

    axios
      .get("https://esgoo.net/api-tinhthanh/1/0.htm")
      .then((res) => {
        if (res.data?.error === 0) setProvinces(res.data.data);
      })
      .catch(() => toast.error("Không thể tải danh sách tỉnh thành."))
      .finally(() => setIsLoadingLocations(false));
  }, []);

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedAddress((prev) => ({ ...prev, provinceId: id, provinceName: name, districtId: "", districtName: "", wardId: "", wardName: "" }));
    setDistricts([]); setWards([]); clearError("provinceId");

    if (id) {
      const res = await axios.get(`https://esgoo.net/api-tinhthanh/2/${id}.htm`);
      if (res.data?.error === 0) setDistricts(res.data.data);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;

    setSelectedAddress((prev) => ({ ...prev, districtId: id, districtName: name, wardId: "", wardName: "" }));
    setWards([]); clearError("districtId");

    if (id) {
      const res = await axios.get(`https://esgoo.net/api-tinhthanh/3/${id}.htm`);
      if (res.data?.error === 0) setWards(res.data.data);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedAddress((prev) => ({ ...prev, wardId: id, wardName: name }));
  };

  const handlePlaceOrder = async (method: "COD" | "PAYOS") => {
    if (cartItems.length === 0) return toast.error("Giỏ hàng của bạn đang trống!");

    const formErrors = validateCheckoutForm(customerInfo, selectedAddress);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error("Vui lòng kiểm tra lại các thông tin bị đánh dấu đỏ!");
      return;
    }

    setErrors({});
    setIsProcessing(true);

    try {
      const wardStr = selectedAddress.wardName ? `${selectedAddress.wardName}, ` : "";
      const fullAddress = `${selectedAddress.detail}, ${wardStr}${selectedAddress.districtName}, ${selectedAddress.provinceName}`;

      const res = await api.post("/api/orders", {
        fullName: customerInfo.fullName.trim(),
        phone: customerInfo.phone,
        address: fullAddress,
        paymentMethod: method,
        items: cartItems,
      });

    if (res.data.success) {
        if (method === "PAYOS" && res.data.checkoutUrl) {
          // BƯỚC NGOẶT: Chuyển hướng thẳng qua cổng thanh toán PayOS
          window.location.assign(res.data.checkoutUrl);
        } else {
          localStorage.removeItem("cart");
          setCartItems([]);
          toast.success("Đặt hàng thành công!");
          setTimeout(() => {
            router.push(`/order/success?orderCode=${res.data.orderCode}`);
          }, 1500);
        }
      }
    } catch (error: unknown) {
      let errorMsg = "Lỗi hệ thống, vui lòng thử lại sau.";
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="container py-5">
        <h2 className="fw-bold mb-4 text-uppercase">Thanh toán đơn hàng</h2>
        <div className="row g-4">
          
          {/* CỘT TRÁI: FORM */}
          <div className="col-lg-7">
            <div className="card shadow-sm p-4 border-0 rounded-4">
              <h5 className="fw-bold text-danger mb-4">
                <i className="bi bi-geo-alt-fill me-2"></i>THÔNG TIN GIAO HÀNG
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Họ và tên <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                    placeholder="Nhập họ tên người nhận"
                    value={customerInfo.fullName}
                    onChange={(e) => { setCustomerInfo((prev) => ({ ...prev, fullName: e.target.value })); clearError("fullName"); }}
                  />
                  {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Số điện thoại <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="VD: 0901234567"
                    value={customerInfo.phone}
                    onChange={(e) => { setCustomerInfo((prev) => ({ ...prev, phone: e.target.value })); clearError("phone"); }}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Tỉnh / Thành <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.provinceId ? "is-invalid" : ""}`} value={selectedAddress.provinceId} onChange={handleProvinceChange} disabled={isLoadingLocations}>
                    <option value="">{isLoadingLocations ? "Đang tải..." : "Chọn Tỉnh/Thành"}</option>
                    {provinces.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
                  </select>
                  {errors.provinceId && <div className="invalid-feedback">{errors.provinceId}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Quận / Huyện <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.districtId ? "is-invalid" : ""}`} value={selectedAddress.districtId} onChange={handleDistrictChange} disabled={!districts.length}>
                    <option value="">Chọn Quận/Huyện</option>
                    {districts.map((d) => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
                  </select>
                  {errors.districtId && <div className="invalid-feedback">{errors.districtId}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Phường / Xã</label>
                  <select className="form-select" value={selectedAddress.wardId} onChange={handleWardChange} disabled={!wards.length}>
                    <option value="">Chọn Phường/Xã</option>
                    {wards.map((w) => (<option key={w.id} value={w.id}>{w.full_name}</option>))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Địa chỉ cụ thể <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.detail ? "is-invalid" : ""}`}
                    placeholder="Số nhà, tên đường..."
                    value={selectedAddress.detail}
                    onChange={(e) => { setSelectedAddress((p) => ({ ...p, detail: e.target.value })); clearError("detail"); }}
                  />
                  {errors.detail && <div className="invalid-feedback">{errors.detail}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: ĐƠN HÀNG */}
          <div className="col-lg-5">
            <div className="card shadow-sm p-4 border-0 rounded-4 position-sticky" style={{ top: "20px" }}>
              <h5 className="fw-bold mb-4 border-bottom pb-2">ĐƠN HÀNG CỦA BẠN</h5>

              {cartItems.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Giỏ hàng của bạn đang trống</p>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => router.push("/")}>Tiếp tục mua sắm</button>
                </div>
              ) : (
                <>
                  <div className="mb-3 custom-scrollbar" style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
                    {cartItems.map((item, index) => (
                      <div key={`${item.variantId}-${index}`} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                        {/* 1. Hình ảnh */}
                        <div className="flex-shrink-0 me-3" style={{ width: "65px", height: "65px" }}>
                          <Image src={item.image || "/placeholder-product.png"} alt={item.productName} width={65} height={65} className="w-100 h-100 object-fit-cover rounded-3 border shadow-sm" />
                        </div>

                        {/* 2. Tên và Số lượng (Đã mở rộng không gian, text bọc xuống dòng) */}
                        <div className="flex-grow-1 pe-2">
                          <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "0.95rem", lineHeight: "1.3" }}>
                            {item.productName}
                          </h6>
                          <div className="text-muted small mt-1">
                            Số lượng: <span className="text-danger fw-bold fs-6">x{item.quantity}</span>
                          </div>
                        </div>

                        {/* 3. Giá tiền */}
                        <div className="flex-shrink-0 text-end">
                          <span className="fw-bold text-dark fs-6">{(item.price * item.quantity).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tổng cộng */}
                  <div className="bg-light p-3 rounded-3 mb-4 border">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="h6 mb-0 fw-bold text-secondary">Tổng thanh toán:</span>
                      <span className="h4 mb-0 fw-bold text-danger">{totalPrice.toLocaleString()}đ</span>
                    </div>
                  </div>

                  {/* Các nút bấm */}
                  <button onClick={() => handlePlaceOrder("PAYOS")} disabled={isProcessing} className="btn btn-primary btn-lg w-100 fw-bold mb-3 shadow py-3 d-flex justify-content-center align-items-center" style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)', border: 'none' }}>
                    {isProcessing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-qr-code-scan me-2 fs-5"></i>}
                    {isProcessing ? "ĐANG XỬ LÝ..." : "THANH TOÁN PAYOS (Quét QR)"}
                  </button>

                  <button onClick={() => handlePlaceOrder("COD")} disabled={isProcessing} className="btn btn-outline-dark w-100 fw-bold py-3 d-flex justify-content-center align-items-center border-2">
                    {isProcessing ? "ĐANG XỬ LÝ..." : "GIAO HÀNG TẬN NƠI (COD)"}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}