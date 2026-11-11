"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import toast from "react-hot-toast";
import type { Product, ApiResponse } from "../../type";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

// Hàm giải mã Token an toàn hỗ trợ đầy đủ tiếng Việt UTF-8 và Base64Url
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Đã hết hạn
    }
    return true; // Hợp lệ
  } catch {
    return false; // Lỗi định dạng coi như hết hạn
  }
};

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

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  userName?: string;
  userPhone?: string;
  user?: { name: string };
}

export default function ProductDetailClient({
  initialProduct,
}: {
  initialProduct: Product;
}) {
  const router = useRouter();

  // State dữ liệu
  const [product] = useState<Product>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [mainImage, setMainImage] = useState(
    initialProduct.images?.[0]?.url || "https://via.placeholder.com/600",
  );

  // State chọn số lượng (cho sản phẩm đơn biến thể)
  const [quantity, setQuantity] = useState(1);
  // State số lượng từng biến thể (cho sản phẩm đa biến thể)
  const [variantQuantities, setVariantQuantities] = useState<
    Record<number, number>
  >({});

  // Kiểm tra sản phẩm có nhiều biến thể thực sự không
  const hasMultipleVariants =
    (initialProduct.variants?.length ?? 0) > 1 ||
    (initialProduct.variants?.length === 1 &&
      initialProduct.variants[0].name !== "Mặc định");

  // State Đánh giá & Auth
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Đồng bộ trạng thái Auth và khôi phục form đánh giá đã lưu tạm trong sessionStorage
  const syncAuthAndRestoreForm = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");

    if (token && isTokenValid(token)) {
      setIsLoggedIn(true);
    } else {
      if (token) {
        // Token đã hết hạn -> dọn dẹp sạch sẽ
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "admin_token=; path=/; max-age=0";
      }
      setIsLoggedIn(false);
    }

    // Khôi phục nội dung nhận xét lưu tạm nếu có
    const saved = sessionStorage.getItem(`pending_review_${initialProduct.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.rating) setRating(parsed.rating);
        if (parsed.comment) {
          setComment(parsed.comment);
          toast.success("Đã khôi phục nội dung đánh giá của bạn!", {
            icon: "📝",
          });
        }
      } catch {
        // Bỏ qua lỗi parse
      }
    }
  }, [initialProduct.id]);

  useEffect(() => {
    syncAuthAndRestoreForm();
    window.addEventListener("authUpdated", syncAuthAndRestoreForm);
    return () => {
      window.removeEventListener("authUpdated", syncAuthAndRestoreForm);
    };
  }, [syncAuthAndRestoreForm]);

  // Fetch dữ liệu liên quan & Best sellers phụ thuộc vào initialProduct
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoadingRelated(true);
        // Lấy 10 sản phẩm để khi lọc loại trừ sản phẩm hiện tại vẫn luôn đủ 6 thẻ
        const relatedRes = await api.get<ApiResponse<Product[]>>(
          `/api/products?categoryId=${initialProduct.categoryId}&excludeId=${initialProduct.id}&limit=10`,
        );
        if (isMounted && relatedRes.data?.data) {
          const filtered = relatedRes.data.data
            .filter((p) => p.id !== initialProduct.id)
            .slice(0, 6);
          setRelatedProducts(filtered);
        }

        const allRes = await api.get<ApiResponse<Product[]>>(
          `/api/products?limit=10`,
        );
        if (isMounted && allRes.data?.data) {
          const filtered = allRes.data.data
            .filter((p) => p.id !== initialProduct.id)
            .slice(0, 6);
          setBestSellers(filtered);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu gợi ý:", err);
      } finally {
        if (isMounted) setLoadingRelated(false);
      }
    };

    // Đặt state ảnh chính lại khi đổi sản phẩm
    setMainImage(
      initialProduct.images?.[0]?.url || "https://via.placeholder.com/600",
    );
    setQuantity(1);

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [initialProduct.id, initialProduct.categoryId, initialProduct.images]);

  // Kéo danh sách bình luận từ Database
  useEffect(() => {
    let isMounted = true;
    api
      .get(`/api/products/${product.id}/reviews`)
      .then((res) => {
        if (isMounted) setReviews(res.data.data || []);
      })
      .catch((err) => console.error("Lỗi tải reviews:", err));
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Cập nhật số lượng biến thể trong bảng
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

  // Gom và đẩy vào giỏ hàng
  const addItemsToCart = (
    items: {
      variant: { id: number; price: number; name: string };
      qty: number;
    }[],
  ) => {
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

  // Thêm vào giỏ đơn biến thể
  const handleAddToCart = () => {
    const v = product.variants?.[0];
    if (!v) return;
    addItemsToCart([{ variant: v, qty: quantity }]);
  };

  // Mua ngay đơn biến thể
  const handleBuyNow = () => {
    const v = product.variants?.[0];
    if (!v) return;
    addItemsToCart([{ variant: v, qty: quantity }]);
    router.push("/cart");
  };

  // Thêm hàng loạt vào giỏ (Đa biến thể)
  const handleBulkAddToCart = () => {
    const items = (product.variants || [])
      .filter((v) => (variantQuantities[v.id] || 0) > 0)
      .map((v) => ({ variant: v, qty: variantQuantities[v.id] }));
    if (items.length === 0) {
      toast.error("Vui lòng chọn số lượng ít nhất 1 sản phẩm!");
      return;
    }
    addItemsToCart(items);
    setVariantQuantities({});
  };

  // Mua ngay hàng loạt (Đa biến thể)
  const handleBulkBuyNow = () => {
    const items = (product.variants || [])
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

  // Mở Zalo Hotline báo giá
  const handleZaloContact = () => {
    const zaloPhone = "0903989096";
    const message = `Chào Điện Nước Trường Tín, tôi cần tư vấn/báo giá sản phẩm: ${product.name} (Số lượng: ${quantity} ${product.unit || "Cái"}). Vui lòng hỗ trợ giúp tôi!`;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    toast.success("Đã sao chép nội dung! Đang mở Zalo...", { icon: "💬" });
    window.open(
      `https://zalo.me/${zaloPhone}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // Gửi bình luận đánh giá
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao để đánh giá!");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung cảm nhận của bạn!");
      return;
    }

    const token = localStorage.getItem("token");

    // Kiểm tra tính hợp lệ trước khi gửi
    if (!token || !isTokenValid(token)) {
      // Lưu tạm dữ liệu vào sessionStorage
      sessionStorage.setItem(
        `pending_review_${product.id}`,
        JSON.stringify({ rating, comment }),
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("authUpdated"));
      setIsLoggedIn(false);
      toast.error(
        "Phiên đăng nhập đã hết hạn. Đã lưu tạm nội dung, vui lòng đăng nhập lại để gửi!",
      );
      // Kích hoạt mở modal đăng nhập
      const modalBtn = document.querySelector(
        '[data-bs-target="#authModal"]',
      ) as HTMLElement;
      if (modalBtn) modalBtn.click();
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await api.post(
        "/api/reviews",
        { productId: product.id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        toast.success("Cảm ơn bạn đã gửi đánh giá!", { icon: "⭐" });
        setReviews([res.data.data, ...reviews]);
        setRating(5);
        setComment("");
        // Xóa dữ liệu tạm khi đã gửi thành công
        sessionStorage.removeItem(`pending_review_${product.id}`);
      }
    } catch (error: any) {
      console.error("Lỗi gửi đánh giá:", error);
      if (error.response?.status === 401) {
        // Lưu tạm nội dung để không bị mất
        sessionStorage.setItem(
          `pending_review_${product.id}`,
          JSON.stringify({ rating, comment }),
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authUpdated"));
        setIsLoggedIn(false);
        toast.error(
          "Phiên đăng nhập đã hết hạn. Đã lưu tạm đánh giá, vui lòng đăng nhập lại!",
        );
      } else {
        toast.error("Có lỗi xảy ra, không thể gửi đánh giá lúc này.");
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const currentVariant = product.variants?.[0];
  const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;

  // Thống kê sao đánh giá
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(
          1,
        )
      : "5.0";

  const starPercentages = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.filter((r) => Math.round(r.rating) === s).length;
    const percent =
      totalReviews > 0 ? (count / totalReviews) * 100 : s === 5 ? 100 : 0;
    return { star: s, count, percent };
  });

  return (
    <div className="container my-4 my-md-5">
      {/* HÀNG 1: THÔNG TIN CHI TIẾT SẢN PHẨM */}
      <div className="row g-4 mb-5">
        <div className="col-12">
          <div className="bg-white p-3 p-md-5 rounded-4 shadow-sm border">
            <div className="row g-4 g-lg-5">
              {/* CỘT TRÁI: HÌNH ẢNH */}
              <div className="col-md-6">
                <div
                  className="border rounded-4 p-2 mb-3 bg-white shadow-sm position-relative overflow-hidden product-image-container"
                  style={{ height: "420px" }}
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
                      transform: scale(1.08);
                    }
                    .transition-transform {
                      transition: transform 0.3s ease-in-out;
                    }
                  `}</style>
                </div>

                {/* DẢI THUMBNAIL: Chỉ render khi có từ 2 tấm ảnh trở lên */}
                {product.images && product.images.length > 1 && (
                  <div className="d-flex gap-2 overflow-auto pb-2 hide-scrollbar">
                    {product.images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setMainImage(img.url)}
                        className={`position-relative border rounded-3 transition-all ${
                          mainImage === img.url
                            ? "border-primary border-2 shadow-sm"
                            : "border-light opacity-50"
                        }`}
                        style={{
                          minWidth: "75px",
                          height: "75px",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={img.url}
                          alt={`thumb-${index}`}
                          fill
                          unoptimized={!img.url.includes("res.cloudinary.com")}
                          className="object-fit-cover"
                          sizes="75px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: BREADCRUMB, THÔNG TIN VÀ MUA HÀNG */}
              <div className="col-md-6 d-flex flex-column">
                {/* BREADCRUMB 3 CẤP CHUẨN */}
                <nav aria-label="breadcrumb" className="mb-2">
                  <ol
                    className="breadcrumb mb-0 small"
                    style={{ fontSize: "13px" }}
                  >
                    <li className="breadcrumb-item">
                      <Link
                        href="/"
                        className="text-decoration-none text-muted"
                      >
                        Trang chủ
                      </Link>
                    </li>
                    {product.category && (
                      <li className="breadcrumb-item">
                        <Link
                          href={`/category/${product.category.slug}`}
                          className="text-decoration-none fw-semibold"
                          style={{ color: "#0078D4" }}
                        >
                          {product.category.name}
                        </Link>
                      </li>
                    )}
                    <li
                      className="breadcrumb-item active text-dark fw-semibold text-truncate"
                      aria-current="page"
                      style={{ maxWidth: "260px" }}
                      title={product.name}
                    >
                      {product.name}
                    </li>
                  </ol>
                </nav>

                <h1 className="fw-bold text-dark mb-2 lh-base fs-3 fs-md-2">
                  {product.name}
                </h1>

                {/* TRẠNG THÁI TỒN KHO */}
                <div className="mb-3">
                  {totalStock > 0 ? (
                    <span className="badge bg-success-subtle text-success px-3 py-2 fs-6 rounded-pill">
                      <i className="bi bi-check2-circle me-1"></i> Còn hàng
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger px-3 py-2 fs-6 rounded-pill">
                      <i className="bi bi-x-circle me-1"></i> Hết hàng
                    </span>
                  )}
                </div>

                {/* ============================================================ */}
                {/* TRƯỜNG HỢP 1: SẢN PHẨM ĐA BIẾN THỂ (BẢNG QUY CÁCH)         */}
                {/* ============================================================ */}
                {hasMultipleVariants ? (
                  <div>
                    <div className="d-flex align-items-center mb-3">
                      <span className="text-muted me-2">Đơn vị tính:</span>
                      <span className="fw-bold text-dark">
                        {product.unit || "Cái"}
                      </span>
                    </div>

                    {/* BẢNG CHỌN SỐ LƯỢNG CHO TỪNG BIẾN THỂ */}
                    <div
                      className="d-flex flex-column gap-2 mb-3 custom-scrollbar"
                      style={{ maxHeight: "320px", overflowY: "auto" }}
                    >
                      {(product.variants || []).map((v) => {
                        const qty = variantQuantities[v.id] || 0;
                        const isSelected = qty > 0;
                        return (
                          <div
                            key={v.id}
                            className={`p-3 border rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary-subtle shadow-sm"
                                : "bg-white"
                            }`}
                          >
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark fs-6">
                                {v.name}
                              </div>
                              <div className="d-flex align-items-center gap-3 small mt-1">
                                <div>
                                  {v.price > 0 ? (
                                    <span className="text-primary fw-bold fs-6">
                                      {v.price.toLocaleString("vi-VN")} đ
                                    </span>
                                  ) : (
                                    <span className="text-danger fw-semibold fst-italic">
                                      Liên hệ báo giá
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

                            {/* Cụm tăng giảm số lượng */}
                            <div>
                              {v.stock > 0 ? (
                                <div
                                  className="d-flex align-items-center border rounded-3 overflow-hidden bg-white shadow-sm"
                                  style={{ height: "36px", width: "115px" }}
                                >
                                  <button
                                    className="btn btn-light border-0 px-2 h-100 d-flex align-items-center justify-content-center"
                                    onClick={() =>
                                      updateVariantQty(v.id, -1, v.stock)
                                    }
                                    disabled={qty <= 0}
                                    style={{ width: "36px" }}
                                    aria-label="Giảm"
                                  >
                                    <i className="bi bi-dash"></i>
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="form-control text-center border-0 bg-transparent fw-bold p-0 h-100"
                                    style={{ width: "43px" }}
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
                                    style={{ width: "36px" }}
                                    aria-label="Tăng"
                                  >
                                    <i className="bi bi-plus"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary small">
                                  Hết hàng
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* NÚT HÀNH ĐỘNG ĐA BIẾN THỂ */}
                    <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
                      <button
                        className="btn btn-primary fw-bold flex-grow-1 py-2 rounded-3 shadow-sm"
                        style={{
                          backgroundColor: "#0078D4",
                          borderColor: "#0078D4",
                        }}
                        onClick={handleBulkAddToCart}
                      >
                        <i className="bi bi-cart-plus me-1"></i> THÊM VÀO GIỎ
                      </button>
                      <button
                        className="btn btn-danger fw-bold flex-grow-1 py-2 rounded-3 shadow-sm"
                        onClick={handleBulkBuyNow}
                      >
                        <i className="bi bi-bag-check me-1"></i> MUA NGAY
                      </button>
                    </div>

                    <div className="mt-2">
                      <button
                        className="btn btn-outline-primary fw-bold w-100 py-2 rounded-3"
                        style={{ borderColor: "#0068FF", color: "#0068FF" }}
                        onClick={handleZaloContact}
                      >
                        <i className="bi bi-chat-dots me-1"></i> BÁO GIÁ ZALO
                      </button>
                    </div>

                    {/* HỘP HỖ TRỢ KỸ THUẬT (QUICK HELP BOX) */}
                    <div className="p-3 mt-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-white p-2 shadow-sm text-primary">
                        <i className="bi bi-headset fs-4"></i>
                      </div>
                      <div className="small">
                        <div className="fw-bold text-dark">
                          Cần tư vấn kỹ thuật hoặc lấy giá sỉ công trình?
                        </div>
                        <div className="text-muted">
                          Liên hệ Zalo / Hotline:{" "}
                          <a
                            href="https://zalo.me/0903989096"
                            target="_blank"
                            rel="noreferrer"
                            className="fw-bold text-primary text-decoration-none"
                          >
                            0903 989 096
                          </a>{" "}
                          (Hỗ trợ từ 7:30 - 17:30)
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================ */
                  /* TRƯỜNG HỢP 2: SẢN PHẨM ĐƠN BIẾN THỂ                        */
                  /* ============================================================ */
                  <div>
                    {/* KHỐI GIÁ TIỀN */}
                    <div className="mb-3 d-flex align-items-baseline gap-2">
                      <span
                        className="fw-bold fs-1"
                        style={{ color: "#0078D4" }}
                      >
                        {(currentVariant?.price ?? 0) > 0
                          ? currentVariant!.price.toLocaleString("vi-VN")
                          : "Liên hệ"}
                      </span>
                      {(currentVariant?.price ?? 0) > 0 && (
                        <span
                          className="fw-bold fs-4"
                          style={{ color: "#0078D4" }}
                        >
                          đ
                        </span>
                      )}
                      <span className="text-muted fs-6 ms-1">
                        / {product.unit || "Cái"}
                      </span>
                    </div>

                    {!(currentVariant?.price && currentVariant.price > 0) && (
                      <div className="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3 border-0">
                        <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                        <span className="small">
                          Sản phẩm báo giá theo thời điểm hoặc quy cách dự án.
                          Vui lòng liên hệ Hotline/Zalo{" "}
                          <strong>0903 989 096</strong>.
                        </span>
                      </div>
                    )}

                    {/* CHỌN SỐ LƯỢNG */}
                    <div className="mb-3 d-flex align-items-center gap-3">
                      <span className="text-muted fw-semibold small">
                        Số lượng:
                      </span>
                      <div
                        className="d-flex align-items-center border rounded-3 overflow-hidden bg-white shadow-sm"
                        style={{ height: "40px", width: "125px" }}
                      >
                        <button
                          className="btn btn-light border-0 px-2 h-100"
                          style={{ width: "40px" }}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          aria-label="Giảm"
                        >
                          <i className="bi bi-dash"></i>
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="form-control text-center border-0 bg-white fw-bold px-1"
                          style={{ width: "45px" }}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              setQuantity(
                                Math.min(
                                  currentVariant?.stock || 999,
                                  Math.max(1, val),
                                ),
                              );
                            }
                            if (e.target.value === "") setQuantity(1);
                          }}
                        />
                        <button
                          className="btn btn-light border-0 px-2 h-100"
                          style={{ width: "40px" }}
                          onClick={() =>
                            setQuantity(
                              Math.min(
                                currentVariant?.stock || 999,
                                quantity + 1,
                              ),
                            )
                          }
                          disabled={quantity >= (currentVariant?.stock || 999)}
                          aria-label="Tăng"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* CỤM NÚT MUA HÀNG VÀ BÁO GIÁ */}
                    <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                      {(currentVariant?.price ?? 0) > 0 && totalStock > 0 && (
                        <>
                          <button
                            className="btn btn-primary fw-bold flex-grow-1 py-2 rounded-3 shadow-sm"
                            style={{
                              backgroundColor: "#0078D4",
                              borderColor: "#0078D4",
                            }}
                            onClick={handleAddToCart}
                          >
                            <i className="bi bi-cart-plus me-1"></i> THÊM GIỎ
                          </button>
                          <button
                            className="btn btn-danger fw-bold flex-grow-1 py-2 rounded-3 shadow-sm"
                            onClick={handleBuyNow}
                          >
                            <i className="bi bi-bag-check me-1"></i> MUA NGAY
                          </button>
                        </>
                      )}
                      {(!(currentVariant?.price && currentVariant.price > 0) ||
                        totalStock === 0) && (
                        <button
                          className="btn btn-primary fw-bold w-100 py-2 rounded-3 shadow-sm"
                          style={{
                            backgroundColor: "#0068FF",
                            borderColor: "#0068FF",
                          }}
                          onClick={handleZaloContact}
                        >
                          <i className="bi bi-chat-dots me-1"></i> NHẬN BÁO GIÁ
                          ZALO
                        </button>
                      )}
                    </div>

                    {(currentVariant?.price ?? 0) > 0 && totalStock > 0 && (
                      <div className="mt-2">
                        <button
                          className="btn btn-outline-primary fw-bold w-100 py-2 rounded-3"
                          style={{ borderColor: "#0068FF", color: "#0068FF" }}
                          onClick={handleZaloContact}
                        >
                          <i className="bi bi-chat-dots me-1"></i> LIÊN HỆ ZALO
                          BÁO GIÁ SỈ
                        </button>
                      </div>
                    )}

                    {/* HỘP HỖ TRỢ KỸ THUẬT (QUICK HELP BOX) */}
                    <div className="p-3 mt-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-white p-2 shadow-sm text-primary">
                        <i className="bi bi-headset fs-4"></i>
                      </div>
                      <div className="small">
                        <div className="fw-bold text-dark">
                          Cần tư vấn kỹ thuật hoặc lấy giá sỉ công trình?
                        </div>
                        <div className="text-muted">
                          Liên hệ Zalo / Hotline:{" "}
                          <a
                            href="https://zalo.me/0903989096"
                            target="_blank"
                            rel="noreferrer"
                            className="fw-bold text-primary text-decoration-none"
                          >
                            0903 989 096
                          </a>{" "}
                          (Hỗ trợ từ 7:30 - 17:30)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 2: THÔNG SỐ KỸ THUẬT & MÔ TẢ CHI TIẾT (TÁI CẤU TRÚC PHÂN VÙNG CÂN ĐỐI) */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <div className="row g-4 g-lg-5">
              {/* PHÂN VÙNG 1: BẢNG THÔNG SỐ KỸ THUẬT (SPECIFICATIONS TABLE) */}
              <div className="col-lg-5">
                <div className="border rounded-4 p-3 p-md-4 h-100 bg-light-subtle">
                  <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-gear-wide-connected text-primary"></i>
                    THÔNG SỐ KỸ THUẬT
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered table-sm mb-0 rounded-3 overflow-hidden bg-white">
                      <tbody>
                        <tr>
                          <td
                            className="text-muted py-2 px-3 fw-medium"
                            style={{ width: "45%" }}
                          >
                            Tên sản phẩm
                          </td>
                          <td className="fw-bold text-dark py-2 px-3">
                            {product.name}
                          </td>
                        </tr>
                        {product.category && (
                          <tr>
                            <td className="text-muted py-2 px-3 fw-medium">
                              Danh mục
                            </td>
                            <td className="fw-semibold text-primary py-2 px-3">
                              {product.category.name}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="text-muted py-2 px-3 fw-medium">
                            Đơn vị tính
                          </td>
                          <td className="text-dark py-2 px-3">
                            {product.unit || "Cái"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted py-2 px-3 fw-medium">
                            Tình trạng kho
                          </td>
                          <td className="py-2 px-3">
                            {totalStock > 0 ? (
                              <span className="badge bg-success-subtle text-success border-0">
                                Còn hàng
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning border-0">
                                Liên hệ kho
                              </span>
                            )}
                          </td>
                        </tr>
                        {product.attributes &&
                          typeof product.attributes === "object" &&
                          Object.entries(product.attributes).map(
                            ([key, value], idx) => (
                              <tr key={idx}>
                                <td className="text-muted py-2 px-3 fw-medium">
                                  {key}
                                </td>
                                <td className="fw-medium text-dark py-2 px-3">
                                  {String(value)}
                                </td>
                              </tr>
                            ),
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* PHÂN VÙNG 2: MÔ TẢ & CAM KẾT TRƯỜNG TÍN (SMART FALLBACK) */}
              <div className="col-lg-7 d-flex flex-column">
                <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  MÔ TẢ CHI TIẾT
                </h5>
                <div
                  className="lh-lg mb-4 text-secondary"
                  style={{ fontSize: "0.95rem" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description &&
                      product.description.trim().length >= 10
                        ? product.description
                        : `<p class="text-dark">${product.name} là sản phẩm chính hãng được phân phối tại Cửa hàng Điện Nước Trường Tín, đảm bảo chất lượng và tiêu chuẩn an toàn kỹ thuật cao nhất.</p>`,
                  }}
                />

                {/* KHỐI CAM KẾT VÀ CHÍNH SÁCH BẢO HÀNH CHUẨN TỪ TRƯỜNG TÍN */}
                <div className="mt-auto border rounded-4 p-3 p-md-4 bg-light">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-shield-check text-success fs-5"></i>
                    CAM KẾT & CHÍNH SÁCH TẠI ĐIỆN NƯỚC TRƯỜNG TÍN
                  </h6>
                  <div className="row g-3 small">
                    <div className="col-sm-6 d-flex align-items-start gap-2">
                      <i className="bi bi-arrow-repeat text-primary fs-5 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark d-block">
                          Đổi trả trong 7 ngày
                        </strong>
                        <span className="text-muted">
                          Đổi mới nếu lỗi kỹ thuật nhà sản xuất hoặc mua nhầm
                          kích thước ren/ống.
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-6 d-flex align-items-start gap-2">
                      <i className="bi bi-patch-check text-success fs-5 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark d-block">
                          100% Hàng chính hãng
                        </strong>
                        <span className="text-muted">
                          Đầy đủ hóa đơn, CO/CQ từ nhà sản xuất (Bình Minh,
                          Cadivi, Panasonic...).
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-6 d-flex align-items-start gap-2">
                      <i className="bi bi-truck text-warning fs-5 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark d-block">
                          Giao hàng nhanh 2H
                        </strong>
                        <span className="text-muted">
                          Giao tận chân công trình khu vực Bình Thạnh, Gò Vấp,
                          Phú Nhuận.
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-6 d-flex align-items-start gap-2">
                      <i className="bi bi-geo-alt text-danger fs-5 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark d-block">
                          Kiểm tra hàng trực tiếp
                        </strong>
                        <span className="text-muted">
                          358 Nơ Trang Long, P.13, Q. Bình Thạnh, TP.HCM.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HÀNG 3: ĐÁNH GIÁ & NHẬN XÉT (LAYOUT 2 CỘT CÂN ĐỐI) */}
      <div className="row mb-5">
        <div className="col-12">
          <section className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            <h4
              className="fw-bold text-uppercase mb-4 d-flex align-items-center gap-2"
              style={{ color: "#1a3a5c" }}
            >
              <span
                style={{
                  width: "5px",
                  height: "22px",
                  backgroundColor: "#0078D4",
                  borderRadius: "2px",
                  display: "inline-block",
                }}
              ></span>
              ĐÁNH GIÁ & NHẬN XÉT
            </h4>

            <div className="row g-4 g-lg-5">
              {/* CỘT TRÁI (col-lg-5): TỔNG QUAN ĐIỂM + BIỂU ĐỒ SAO + FORM */}
              <div className="col-lg-5">
                {/* ĐIỂM TRUNG BÌNH & BIỂU ĐỒ PHÂN BỔ */}
                <div className="p-3 p-md-4 rounded-4 bg-light border mb-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="display-5 fw-bold text-dark">
                      {averageRating}
                    </div>
                    <div>
                      <div className="text-warning fs-5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <i
                            key={s}
                            className={`bi ${
                              s <= Math.round(Number(averageRating))
                                ? "bi-star-fill"
                                : "bi-star"
                            }`}
                          ></i>
                        ))}
                      </div>
                      <div className="text-muted small">
                        Dựa trên <strong>{totalReviews}</strong> đánh giá
                      </div>
                    </div>
                  </div>

                  {/* THANH TỶ LỆ SAO (5★ ĐẾN 1★) */}
                  <div className="d-flex flex-column gap-2 small">
                    {starPercentages.map(({ star, count, percent }) => (
                      <div
                        key={star}
                        className="d-flex align-items-center gap-2"
                      >
                        <span
                          className="text-muted fw-semibold"
                          style={{ width: "35px" }}
                        >
                          {star}{" "}
                          <i className="bi bi-star-fill text-warning"></i>
                        </span>
                        <div
                          className="progress flex-grow-1"
                          style={{ height: "8px" }}
                        >
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${percent}%` }}
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span
                          className="text-muted"
                          style={{ width: "25px", textAlign: "right" }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FORM GỬI ĐÁNH GIÁ */}
                <div className="p-3 p-md-4 border rounded-4 bg-white shadow-sm">
                  {!isLoggedIn ? (
                    <div className="text-center py-2">
                      <i className="bi bi-person-lock fs-1 text-primary mb-2 d-block"></i>
                      <p className="fw-bold mb-1 text-dark">
                        Đăng nhập để chia sẻ trải nghiệm
                      </p>
                      <p className="text-muted small mb-3">
                        Đánh giá của bạn giúp cửa hàng nâng cao chất lượng phục
                        vụ
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary px-4 py-2 rounded-pill fw-bold btn-sm shadow-sm"
                        style={{
                          backgroundColor: "#0078D4",
                          borderColor: "#0078D4",
                        }}
                        data-bs-toggle="modal"
                        data-bs-target="#authModal"
                      >
                        ĐĂNG NHẬP ĐỂ ĐÁNH GIÁ
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h6 className="fw-bold text-dark mb-2">
                        Gửi nhận xét của bạn:
                      </h6>
                      <div className="star-rating-input mb-3 d-flex gap-2 text-warning">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`bi fs-4 cursor-pointer ${
                              star <= (hoverRating || rating)
                                ? "bi-star-fill"
                                : "bi-star text-muted"
                            }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            style={{ cursor: "pointer", transition: "0.15s" }}
                          ></i>
                        ))}
                      </div>

                      <textarea
                        className="form-control mb-3 p-3 border bg-light"
                        rows={3}
                        style={{ borderRadius: "12px", fontSize: "14px" }}
                        placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm và dịch vụ giao hàng..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>

                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">
                          Đã chọn: <strong>{rating} sao</strong>
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary px-4 py-2 fw-bold rounded-pill btn-sm shadow-sm"
                          style={{
                            backgroundColor: "#0078D4",
                            borderColor: "#0078D4",
                          }}
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? "Đang gửi..." : "GỬI ĐÁNH GIÁ"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (col-lg-7): DANH SÁCH BÌNH LUẬN THỰC TẾ TỪ DATABASE */}
              <div className="col-lg-7">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold text-dark mb-0">
                    Khách hàng nhận xét ({reviews.length})
                  </h5>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-5 px-3 border rounded-4 bg-light">
                    <i className="bi bi-chat-left-dots text-muted fs-1 mb-2 d-block opacity-50"></i>
                    <p className="text-muted mb-0 small">
                      Chưa có nhận xét nào cho sản phẩm này. Hãy là người đầu
                      tiên chia sẻ trải nghiệm thực tế với Điện Nước Trường Tín!
                    </p>
                  </div>
                ) : (
                  <div
                    className="d-flex flex-column gap-3"
                    style={{ maxHeight: "560px", overflowY: "auto" }}
                  >
                    {reviews.map((rev) => {
                      const displayName =
                        rev.userName || rev.user?.name || "Khách hàng";
                      return (
                        <div
                          key={rev.id}
                          className="p-3 border rounded-4 bg-light shadow-sm"
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="avatar-placeholder bg-primary text-white d-flex align-items-center justify-content-center fw-bold rounded-circle shadow-sm"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  fontSize: "14px",
                                }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold text-dark small">
                                  {displayName}
                                  {rev.userPhone && (
                                    <span
                                      className="text-muted fw-normal ms-1"
                                      style={{ fontSize: "11px" }}
                                    >
                                      ({rev.userPhone})
                                    </span>
                                  )}
                                </div>
                                <span
                                  className="badge bg-success-subtle text-success border-0 small"
                                  style={{ fontSize: "10px" }}
                                >
                                  ✓ Đã mua tại Trường Tín
                                </span>
                              </div>
                            </div>
                            <span
                              className="text-muted small"
                              style={{ fontSize: "11px" }}
                            >
                              {new Date(rev.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>

                          <div
                            className="text-warning mb-2 small"
                            style={{ fontSize: "12px" }}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i
                                key={star}
                                className={`bi ${
                                  star <= rev.rating
                                    ? "bi-star-fill"
                                    : "bi-star text-muted"
                                } me-1`}
                              ></i>
                            ))}
                          </div>

                          <p className="text-dark mb-0 small lh-base">
                            {rev.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* HÀNG 4: SẢN PHẨM TƯƠNG TỰ & TOP BÁN CHẠY (ĐỒNG BỘ LƯỚI 6 CỘT CHUẨN) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
            {/* SẢN PHẨM TƯƠNG TỰ */}
            {(loadingRelated || relatedProducts.length > 0) && (
              <section className="mb-5">
                <div className="d-flex align-items-center mb-4">
                  <h4
                    className="fw-bold text-uppercase mb-0"
                    style={{ color: "#1a3a5c" }}
                  >
                    Sản phẩm tương tự
                  </h4>
                  <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
                </div>

                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
                  {loadingRelated
                    ? Array(6)
                        .fill(0)
                        .map((_, i) => (
                          <div className="col" key={`skeleton-${i}`}>
                            <div className="card border-0 shadow-sm h-100 placeholder-glow p-2">
                              <div
                                className="bg-secondary bg-opacity-10 rounded placeholder w-100 mb-2"
                                style={{ aspectRatio: "1/1" }}
                              ></div>
                              <span className="placeholder col-8 mb-1"></span>
                              <span className="placeholder col-5"></span>
                            </div>
                          </div>
                        ))
                    : relatedProducts.map((item) => (
                        <div className="col" key={item.id}>
                          <ProductCard item={item} />
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* TOP BÁN CHẠY TẠI TRƯỜNG TÍN */}
            {bestSellers.length > 0 && (
              <section>
                <div className="d-flex align-items-center mb-4">
                  <h4
                    className="fw-bold text-uppercase mb-0"
                    style={{ color: "#1a3a5c" }}
                  >
                    Top bán chạy tại Trường Tín
                  </h4>
                  <div className="flex-grow-1 ms-3 border-bottom opacity-25"></div>
                </div>
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
                  {bestSellers.map((item) => (
                    <div className="col" key={item.id}>
                      <ProductCard item={item} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
