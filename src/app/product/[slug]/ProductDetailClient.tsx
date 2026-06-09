"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import ProductCard from "../../components/ProductCard";
import toast from "react-hot-toast";
import type { Product, ApiResponse } from "../../type";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function ProductDetailClient({
  initialProduct,
}: {
  initialProduct: Product;
}) {
  const router = useRouter();
  // State dữ liệu
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [mainImage, setMainImage] = useState(
    initialProduct.images?.[0]?.url || "https://via.placeholder.com/400",
  );

  // --- STATE CHỌN SỐ LƯỢNG MUA (cho SP đơn biến thể) ---
  const [quantity, setQuantity] = useState(1);
  // --- STATE SỐ LƯỢNG TỪNG BIẾN THỂ (cho SP đa biến thể) ---
  const [variantQuantities, setVariantQuantities] = useState<
    Record<number, number>
  >({});

  // Kiểm tra SP có nhiều biến thể thực sự không (loại trừ SP chỉ có 1 variant "Mặc định")
  const hasMultipleVariants =
    (initialProduct.variants?.length ?? 0) > 1 ||
    (initialProduct.variants?.length === 1 &&
      initialProduct.variants[0].name !== "Mặc định");

  // --- STATE ĐÁNH GIÁ THỰC TẾ ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  // --- ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO GIỎ HÀNG ---
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

  // --- ĐỊNH NGHĨA KIỂU DỮ LIỆU BÌNH LUẬN ---
  interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: { name: string };
  }

  // [AUDIT FIX]: Fetch dữ liệu liên quan & Best sellers phụ thuộc vào initialProduct.id
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRelated(true);
        // Gọi API tối ưu lấy đúng 4 sản phẩm, khác ID hiện tại
        const relatedRes = await api.get<ApiResponse<Product[]>>(
          `/api/products?categoryId=${initialProduct.categoryId}&excludeId=${initialProduct.id}&limit=4`,
        );
        setRelatedProducts(relatedRes.data.data);

        // Lấy Best Sellers (Có thể cache hoặc tối ưu riêng)
        const allRes = await api.get<ApiResponse<Product[]>>(
          `/api/products?limit=4`,
        );
        setBestSellers(allRes.data.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu phụ:", err);
      } finally {
        setLoadingRelated(false);
      }
    };

    // Đặt state ảnh chính lại khi đổi sản phẩm
    setMainImage(
      initialProduct.images?.[0]?.url || "https://via.placeholder.com/400",
    );
    setQuantity(1);

    fetchData();
  }, [initialProduct.id, initialProduct.categoryId, initialProduct.images]);

  // Kiểm tra đăng nhập khi vừa load trang
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Kéo danh sách bình luận từ Database (Nên bỏ vào trong `useEffect` lấy chi tiết sản phẩm ở trên)
  useEffect(() => {
    if (product) {
      // Đã đổi axios thành api để dùng link Render chính thức
      api
        .get(`/api/products/${product.id}/reviews`)
        .then((res) => setReviews(res.data.data || []))
        .catch((err) => console.error("Chưa có API lấy reviews", err));
    }
  }, [product]);

  // --- HÀM CẬP NHẬT SỐ LƯỢNG BIẾN THỂ TRONG BẢNG ---
  const updateVariantQty = (
    variantId: number,
    delta: number,
    maxStock: number,
  ) => {
    setVariantQuantities((prev) => {
      const current = prev[variantId] || 0;
      const next = Math.min(maxStock, Math.max(0, current + delta));
      return { ...prev, [variantId]: next };
    });
  };
  const setVariantQty = (variantId: number, val: number, maxStock: number) => {
    setVariantQuantities((prev) => ({
      ...prev,
      [variantId]: Math.min(maxStock, Math.max(0, val)),
    }));
  };

  // --- LOGIC THÊM VÀO GIỎ HÀNG (SP ĐƠN BIẾN THỂ) ---
  const handleAddToCart = () => {
    if (!product) return;
    const v = product.variants?.[0];
    if (!v) return;
    addItemsToCart([{ variant: v, qty: quantity }]);
  };

  // --- LOGIC THÊM HÀNG LOẠT VÀO GIỎ (BẢNG ĐA BIẾN THỂ) ---
  const handleBulkAddToCart = () => {
    if (!product) return;
    const items = product.variants
      .filter((v) => (variantQuantities[v.id] || 0) > 0)
      .map((v) => ({ variant: v, qty: variantQuantities[v.id] }));
    if (items.length === 0) {
      toast.error("Vui lòng chọn số lượng ít nhất 1 sản phẩm!");
      return;
    }
    addItemsToCart(items);
    setVariantQuantities({}); // Reset bảng
  };

  const handleBuyNow = () => {
    if (!product) return;
    const v = product.variants?.[0];
    if (!v) return;
    addItemsToCart([{ variant: v, qty: quantity }]);
    router.push("/cart");
  };

  const handleBulkBuyNow = () => {
    if (!product) return;
    const items = product.variants
      .filter((v) => (variantQuantities[v.id] || 0) > 0)
      .map((v) => ({ variant: v, qty: variantQuantities[v.id] }));
    if (items.length === 0) {
      toast.error("Vui lòng chọn số lượng ít nhất 1 sản phẩm!");
      return;
    }
    addItemsToCart(items);
    setVariantQuantities({});
    router.push("/cart");
  };

  // --- HÀM CHUNG: GOM VÀ ĐẨY VÀO GIỎ ---
  const addItemsToCart = (
    items: {
      variant: { id: number; price: number; name: string };
      qty: number;
    }[],
  ) => {
    if (!product) return;
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    items.forEach(({ variant, qty }) => {
      const displayName =
        variant.name !== "Mặc định"
          ? `${product.name} - ${variant.name}`
          : product.name;
      const idx = cart.findIndex((c) => c.variantId === variant.id);
      if (idx > -1) {
        cart[idx].quantity += qty;
      } else {
        cart.push({
          productId: product.id,
          productName: displayName,
          slug: product.slug,
          image: mainImage,
          variantId: variant.id,
          price: variant.price,
          quantity: qty,
          unit: product.unit,
        });
      }
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Đã thêm ${items.length} mục vào giỏ hàng!`);
  };

  // --- LOGIC MỞ APP ZALO TỰ ĐỘNG ---
  const handleZaloContact = () => {
    if (!product) return;

    const zaloPhone = "0903989096";

    const message = `Chào Trường Tín, tôi cần tư vấn/mua sản phẩm: ${product.name} - Số lượng: ${quantity} ${product.unit}. Xin báo giá cho tôi.`;
    window.open(
      `https://zalo.me/${zaloPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  // HÀM GỬI BÌNH LUẬN LÊN DATABASE
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao để đánh giá!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Gọi API thực tế gửi lên Backend
      const res = await api.post(
        "/api/reviews",
        { productId: product?.id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }, // Phải có token mới được post
      );

      if (res.data.success) {
        toast.success("Cảm ơn bạn đã đánh giá!");
        // Chèn bình luận mới nhất lên đầu danh sách (Cập nhật UI ngay lập tức)
        setReviews([res.data.data, ...reviews]);
        setRating(0);
        setComment("");
      }
    } catch (error) {
      // Đã xóa : any ở đây
      console.error(error);

      // Dùng hàm chuẩn của thư viện Axios để check lỗi API
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
          setIsLoggedIn(false);
        } else {
          toast.error("Có lỗi xảy ra, không thể gửi đánh giá.");
        }
      } else {
        // Bắt các lỗi khác (lỗi mạng, máy tính mất mạng...)
        toast.error("Lỗi không xác định. Vui lòng thử lại sau!");
      }
    }
  };

  if (!product)
    return <div className="text-center py-5">Sản phẩm không tồn tại!</div>;

  const currentVariant = product.variants?.[0];
  const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;

  return (
    <div className="container my-5">
      {/* HÀNG 1: CHI TIẾT SẢN PHẨM */}
      <div className="row g-4 mb-5">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <div className="row g-5">
              {/* Cột Trái: Khu vực Hình Ảnh */}
              <div className="col-md-6">
                <div
                  className="border rounded-4 p-2 mb-3 bg-white shadow-sm position-relative overflow-hidden product-image-container"
                  style={{ height: "450px" }}
                >
                  <Image
                    src={mainImage || "https://via.placeholder.com/600"}
                    alt={product.name}
                    fill
                    priority
                    unoptimized={
                      !(mainImage || "").includes("res.cloudinary.com")
                    }
                    className="object-fit-contain p-3 transition-transform hover-zoom"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <style jsx>{`
                    .product-image-container:hover .hover-zoom {
                      transform: scale(1.1);
                    }
                    .transition-transform {
                      transition: transform 0.3s ease-in-out;
                    }
                  `}</style>
                </div>
                {product.images && product.images.length > 0 && (
                  <div className="d-flex gap-3 overflow-auto pb-2 hide-scrollbar">
                    {product.images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setMainImage(img.url)}
                        className={`position-relative border rounded-3 transition-all ${mainImage === img.url ? "border-brand border-2 shadow-sm" : "border-light opacity-50"}`}
                        style={{
                          minWidth: "80px",
                          height: "80px",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                        onMouseOver={(e) =>
                          e.currentTarget.classList.remove("opacity-50")
                        }
                        onMouseOut={(e) => {
                          if (mainImage !== img.url)
                            e.currentTarget.classList.add("opacity-50");
                        }}
                      >
                        <Image
                          src={img.url}
                          alt={`thumb-${index}`}
                          fill
                          unoptimized={!img.url.includes("res.cloudinary.com")}
                          className="object-fit-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cột Phải: Thông tin sản phẩm */}
              <div className="col-md-6 d-flex flex-column">
                <nav aria-label="breadcrumb" className="mb-3">
                  <ol className="breadcrumb mb-0" style={{ fontSize: "14px" }}>
                    <li className="breadcrumb-item text-muted">Trang chủ</li>
                    <li
                      className="breadcrumb-item fw-semibold"
                      style={{ color: "#5D4037" }}
                    >
                      {product.category?.name}
                    </li>
                  </ol>
                </nav>

                <h1
                  className="fw-bold text-dark mb-2 lh-base"
                  style={{ fontSize: "2rem" }}
                >
                  {product.name}
                </h1>

                <div className="mb-4">
                  {totalStock > 0 ? (
                    <span className="badge bg-success text-white px-3 py-2 fs-6 rounded-pill shadow-sm">
                      <i className="bi bi-check2-circle me-1"></i> Còn hàng
                    </span>
                  ) : (
                    <span className="badge bg-danger text-white px-3 py-2 fs-6 rounded-pill shadow-sm">
                      <i className="bi bi-x-circle me-1"></i> Hết hàng
                    </span>
                  )}
                </div>

                {/* ============================================================ */}
                {/* TRƯỜNG HỢP 1: SẢN PHẨM CÓ NHIỀU BIẾN THỂ => BẢNG NHẬP LIỆU */}
                {/* ============================================================ */}
                {hasMultipleVariants ? (
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <span className="text-muted fs-5 me-2">Đơn vị tính:</span>
                      <span className="fw-bold fs-5 text-dark">
                        {product.unit || "Cái"}
                      </span>
                    </div>

                    {/* BẢNG DẠNG CARD CHO MOBILE & PC */}
                    <div
                      className="d-flex flex-column gap-2 mb-4 custom-scrollbar"
                      style={{ maxHeight: "380px", overflowY: "auto" }}
                    >
                      {product.variants.map((v) => {
                        const qty = variantQuantities[v.id] || 0;
                        const isSelected = qty > 0;
                        return (
                          <div
                            key={v.id}
                            className={`p-3 border rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 transition-all ${
                              isSelected
                                ? "border-brand bg-brand-subtle shadow-sm"
                                : "bg-white"
                            }`}
                          >
                            {/* Thông tin Biến thể */}
                            <div className="flex-grow-1">
                              <div className="fw-bold mb-1 fs-6 text-dark">
                                {v.name}
                              </div>
                              <div className="d-flex align-items-center gap-3 small">
                                <div>
                                  {v.price > 0 ? (
                                    <span className="text-primary fw-bold fs-6">
                                      {v.price.toLocaleString("vi-VN")} đ
                                    </span>
                                  ) : (
                                    <span className="text-brand fst-italic">
                                      Liên hệ
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted border-start ps-3">
                                  Kho:{" "}
                                  {v.stock > 0 ? (
                                    <span className="text-success fw-bold">
                                      {v.stock}
                                    </span>
                                  ) : (
                                    <span className="text-danger fw-bold">
                                      Hết
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Input Số Lượng */}
                            <div>
                              {v.stock > 0 ? (
                                <div
                                  className="d-flex align-items-center border rounded-3 overflow-hidden bg-white shadow-sm"
                                  style={{ height: "38px", width: "120px" }}
                                >
                                  <button
                                    className="btn btn-light border-0 px-2 h-100 d-flex align-items-center justify-content-center"
                                    onClick={() =>
                                      updateVariantQty(v.id, -1, v.stock)
                                    }
                                    disabled={qty <= 0}
                                    style={{ width: "38px" }}
                                  >
                                    <i className="bi bi-dash"></i>
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="form-control text-center border-0 bg-transparent fw-bold p-0 h-100"
                                    style={{ width: "44px" }}
                                    value={qty}
                                    onChange={(e) =>
                                      setVariantQty(
                                        v.id,
                                        parseInt(e.target.value) || 0,
                                        v.stock,
                                      )
                                    }
                                  />
                                  <button
                                    className="btn btn-light border-0 px-2 h-100 d-flex align-items-center justify-content-center"
                                    onClick={() =>
                                      updateVariantQty(v.id, 1, v.stock)
                                    }
                                    disabled={qty >= v.stock}
                                    style={{ width: "38px" }}
                                  >
                                    <i className="bi bi-plus"></i>
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="text-muted small px-3 py-2 bg-light rounded-3 text-center"
                                  style={{ width: "120px" }}
                                >
                                  Hết hàng
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* NÚT THÊM HÀNG LOẠT */}
                    {(() => {
                      const totalSelectedQty = Object.values(
                        variantQuantities,
                      ).reduce((s, q) => s + q, 0);
                      return (
                        <div className="d-flex flex-column flex-sm-row gap-3 mb-3">
                          <button
                            className={`btn btn-lg fw-bold flex-grow-1 shadow-sm d-flex align-items-center justify-content-center py-3 transition-all ${
                              totalSelectedQty > 0
                                ? "btn-brand"
                                : "btn-secondary opacity-50"
                            }`}
                            onClick={handleBulkAddToCart}
                          >
                            <i className="bi bi-cart-plus fs-4 me-2"></i> THÊM
                            VÀO GIỎ
                          </button>
                          <button
                            className={`btn btn-lg fw-bold flex-grow-1 shadow-sm d-flex align-items-center justify-content-center py-3 transition-all ${
                              totalSelectedQty > 0
                                ? "btn-danger text-white"
                                : "btn-secondary opacity-50"
                            }`}
                            onClick={handleBulkBuyNow}
                          >
                            <i className="bi bi-bag-check fs-4 me-2"></i> MUA
                            NGAY
                          </button>
                        </div>
                      );
                    })()}
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-brand btn-lg fw-bold w-100 d-flex align-items-center justify-content-center py-3"
                        onClick={handleZaloContact}
                      >
                        <i className="bi bi-chat-dots fs-4 me-2"></i> LIÊN HỆ
                        ZALO BÁO GIÁ
                      </button>
                      <div className="text-center text-muted small mt-2 fst-italic">
                        *Liên hệ để nhận báo giá khi mua sỉ để có ưu đãi tốt
                        nhất
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================ */
                  /* TRƯỜNG HỢP 2: SP ĐƠN BIẾN THỂ => GIAO DIỆN CƠ BẢN          */
                  /* ============================================================ */
                  <div>
                    {/* Khối Giá Tiền */}
                    <div className="mb-4 d-flex align-items-baseline gap-2">
                      <span
                        className="text-brand fw-bold"
                        style={{ fontSize: "2.5rem" }}
                      >
                        {currentVariant?.price
                          ? currentVariant.price.toLocaleString("vi-VN")
                          : "Liên hệ"}
                      </span>
                      {(currentVariant?.price ?? 0) > 0 && (
                        <span className="text-brand fw-semibold fs-4">đ</span>
                      )}
                      <span className="text-muted fs-5 ms-2">
                        / {product.unit || "Cái"}
                      </span>
                    </div>

                    {!currentVariant?.price ? (
                      <div className="alert alert-warning py-3 px-4 mb-4 d-flex align-items-start gap-3 rounded-4 border-0 shadow-sm">
                        <i className="bi bi-info-circle-fill text-warning fs-4 flex-shrink-0"></i>
                        <span className="fs-6">
                          Sản phẩm này cần <strong>báo giá riêng</strong> theo
                          số lượng và thời điểm. Vui lòng liên hệ Zalo hoặc gọi
                          Hotline <strong>0903 989 096</strong> để được báo giá
                          tốt nhất.
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted mb-4 d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-circle text-brand"></i>
                        <span style={{ fontSize: "0.9rem" }}>
                          Giá vật tư có thể thay đổi theo thời điểm. Liên hệ để
                          xác nhận giá mới nhất.
                        </span>
                      </div>
                    )}

                    {/* BẢNG THÔNG SỐ KỸ THUẬT ĐỘNG */}
                    {product.attributes &&
                      typeof product.attributes === "object" &&
                      Object.keys(product.attributes).length > 0 && (
                        <div className="mb-4">
                          <h6 className="fw-bold mb-3 text-dark text-uppercase">
                            Thông số kỹ thuật
                          </h6>
                          <table className="table table-striped table-borderless table-sm mb-0">
                            <tbody>
                              {Object.entries(product.attributes).map(
                                ([key, value], index) => (
                                  <tr key={index}>
                                    <td
                                      className="text-muted py-2"
                                      style={{ width: "40%" }}
                                    >
                                      {key}
                                    </td>
                                    <td className="fw-medium text-dark py-2">
                                      {String(value)}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {/* CHỌN SỐ LƯỢNG */}
                    <div className="mb-4 d-flex align-items-center">
                      <div className="text-muted fw-bold me-4 fs-6">
                        Số lượng:
                      </div>
                      <div
                        className="d-flex align-items-center border border-2 rounded-3 overflow-hidden shadow-sm"
                        style={{ height: "50px" }}
                      >
                        <button
                          className="btn btn-light border-0 px-3 h-100"
                          style={{ width: "50px", fontSize: "1.2rem" }}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <i className="bi bi-dash-lg"></i>
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="form-control text-center border-0 bg-white fw-bold px-1"
                          style={{
                            width: "80px",
                            height: "100%",
                            fontSize: "1.2rem",
                          }}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val))
                              setQuantity(
                                Math.min(
                                  currentVariant?.stock || 1,
                                  Math.max(1, val),
                                ),
                              );
                            if (e.target.value === "") setQuantity(1);
                          }}
                        />
                        <button
                          className="btn btn-light border-0 px-3 h-100"
                          style={{ width: "50px", fontSize: "1.2rem" }}
                          onClick={() =>
                            setQuantity(
                              Math.min(
                                currentVariant?.stock || 1,
                                quantity + 1,
                              ),
                            )
                          }
                          disabled={quantity >= (currentVariant?.stock || 1)}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </div>

                    {/* Nút CTA */}
                    <div className="mt-4 d-flex flex-column flex-sm-row gap-3">
                      {currentVariant && currentVariant.stock > 0 && (
                        <>
                          <button
                            className="btn btn-brand btn-lg fw-bold flex-grow-1 shadow d-flex align-items-center justify-content-center py-3 rounded-pill"
                            onClick={handleAddToCart}
                          >
                            <i className="bi bi-cart-plus fs-4 me-2"></i> THÊM
                            VÀO GIỎ
                          </button>
                          <button
                            className="btn btn-danger text-white btn-lg fw-bold flex-grow-1 shadow d-flex align-items-center justify-content-center py-3 rounded-pill"
                            onClick={handleBuyNow}
                          >
                            <i className="bi bi-bag-check fs-4 me-2"></i> MUA
                            NGAY
                          </button>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-brand btn-lg fw-bold w-100 d-flex align-items-center justify-content-center py-3 rounded-pill"
                        onClick={handleZaloContact}
                      >
                        <i className="bi bi-chat-dots fs-4 me-2"></i> LIÊN HỆ
                        ZALO
                      </button>
                      <div className="text-center text-muted small mt-2 fst-italic">
                        *Liên hệ để nhận báo giá khi mua sỉ để có ưu đãi tốt
                        nhất
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 1.5: MÔ TẢ CHI TIẾT (FULL WIDTH VỚI TABS) */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <ul className="nav nav-tabs mb-4 border-bottom-0" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link active fw-bold border-0 border-bottom border-brand border-3 bg-transparent text-brand fs-5 pb-3 px-4"
                  id="desc-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#desc"
                  type="button"
                  role="tab"
                  aria-controls="desc"
                  aria-selected="true"
                >
                  Mô tả chi tiết
                </button>
              </li>
            </ul>
            <div className="tab-content" id="myTabContent">
              <div
                className="tab-pane fade show active"
                id="desc"
                role="tabpanel"
                aria-labelledby="desc-tab"
              >
                <div
                  className="lh-lg"
                  style={{
                    color: "#333",
                    fontSize: "1.05rem",
                    textAlign: "justify",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description ||
                      '<p className="text-muted">Chưa có thông tin mô tả chi tiết cho sản phẩm này.</p>',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CÁC PHẦN DƯỚI ĐÂY GIỮ NGUYÊN HOÀN TOÀN TỪ CODE CŨ */}
      {/* ========================================================================= */}

      {/* HÀNG 2: CONTAINER CHUNG CHO CÁC DANH SÁCH SẢN PHẨM (FULL WIDTH) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            {/* SECTION: TƯƠNG TỰ */}
            {(loadingRelated || relatedProducts.length > 0) && (
              <section className="mb-5">
                <div className="d-flex align-items-center mb-4">
                  <h4 className="section-title-custom text-uppercase mb-0">
                    Sản phẩm tương tự
                  </h4>
                  <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
                </div>

                {/* [AUDIT FIX]: Chỉnh lại lưới responsive Mobile 2, Desktop 4 */}
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                  {loadingRelated
                    ? // Trạng thái Skeleton
                      Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <div className="col" key={`skeleton-${i}`}>
                            <div
                              className="card border-0 shadow-sm h-100"
                              aria-hidden="true"
                            >
                              <div
                                className="bg-secondary opacity-25 placeholder w-100"
                                style={{ height: "200px" }}
                              ></div>
                              <div className="card-body">
                                <h5 className="card-title placeholder-glow">
                                  <span className="placeholder col-6"></span>
                                </h5>
                                <p className="card-text placeholder-glow">
                                  <span className="placeholder col-7"></span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    : // Trạng thái có Data
                      relatedProducts.map((item) => (
                        <div className="col" key={item.id}>
                          <ProductCard item={item} />
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* SECTION: BÁN CHẠY */}
            <section>
              <div className="d-flex align-items-center mb-4">
                <h4 className="section-title-custom text-uppercase mb-0">
                  Top bán chạy tại Trường Tín
                </h4>
                <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
              </div>
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
                {bestSellers.map((item) => (
                  <div className="col" key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* HÀNG 3: ĐÁNH GIÁ (FULL WIDTH) */}
      <div className="row">
        <div className="col-12">
          <section className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-5">
            <h4 className="section-title-custom text-uppercase mb-5">
              Đánh giá & Nhận xét
            </h4>

            <div className="row g-5">
              {/* BÊN TRÁI: KHU VỰC ĐÁNH GIÁ */}
              <div className="col-lg-6">
                {/* Form nhập đánh giá */}
                <div className="mb-5">
                  {!isLoggedIn ? (
                    <div className="text-center p-4 border rounded-4 bg-light shadow-sm">
                      <p className="fw-bold mb-2">
                        Đăng nhập để chia sẻ trải nghiệm của bạn
                      </p>
                      <button
                        className="btn btn-brand px-4 rounded-pill fw-bold btn-sm"
                        onClick={() => setIsLoggedIn(true)}
                      >
                        ĐĂNG NHẬP
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-4 bg-white shadow-sm border-brand border-opacity-25">
                      <p className="fw-bold mb-2 small text-uppercase text-secondary">
                        Đánh giá của bạn:
                      </p>

                      <div className="star-rating-input mb-3 d-flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`bi fs-4 ${star <= (hoverRating || rating) ? "bi-star-fill text-warning" : "bi-star text-muted"}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            style={{ cursor: "pointer", transition: "0.2s" }}
                          ></i>
                        ))}
                      </div>

                      <textarea
                        className="form-control mb-3 border-0 bg-light p-3"
                        rows={3}
                        style={{ borderRadius: "12px", fontSize: "14px" }}
                        placeholder="Cảm nhận của bạn về sản phẩm..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>

                      <div className="text-end">
                        <button
                          className="btn btn-brand px-4 py-2 fw-bold rounded-pill btn-sm"
                          onClick={handleSubmitReview}
                        >
                          GỬI ĐÁNH GIÁ
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* DANH SÁCH BÌNH LUẬN THỰC TẾ TỪ DATABASE */}
                <div className="comment-list">
                  <p className="fw-bold mb-3">
                    Nhận xét từ khách hàng ({product.name})
                  </p>

                  {reviews.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-4">
                      <i className="bi bi-chat-left-dots text-muted fs-3 mb-2 d-block"></i>
                      <p className="text-muted small mb-0">
                        Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản
                        phẩm này!
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="card border-0 bg-light rounded-4 p-3 mb-3 shadow-sm"
                      >
                        <div className="d-flex align-items-center gap-3 mb-2">
                          {/* Lấy chữ cái đầu của tên làm Avatar */}
                          <div
                            className="avatar-placeholder shadow-sm bg-primary text-white d-flex align-items-center justify-content-center fw-bold rounded-circle"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {rev.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold small">
                                {rev.user.name}
                              </span>
                              <span
                                className="badge bg-success-subtle text-success border-0 small"
                                style={{ fontSize: "10px" }}
                              >
                                ✓ Đã mua
                              </span>
                            </div>
                            <div
                              className="text-warning"
                              style={{ fontSize: "12px" }}
                            >
                              {/* Render số sao tương ứng */}
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`bi ${star <= rev.rating ? "bi-star-fill" : "bi-star"}`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-secondary small mb-0 ps-1">
                          {rev.comment}
                        </p>
                        <small
                          className="text-muted mt-2 d-block px-1"
                          style={{ fontSize: "11px" }}
                        >
                          {new Date(rev.createdAt).toLocaleString("vi-VN")}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BÊN PHẢI: ĐỂ TRỐNG (Dành cho nội dung tương lai) */}
              <div className="col-lg-6 d-none d-lg-block border-start"></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
