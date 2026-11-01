'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import './contact.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [selectedTopic, setSelectedTopic] = useState('Báo giá sỉ cho thợ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topics = [
    'Báo giá sỉ cho thợ',
    'Mua lẻ sửa chữa nhà',
    'Tư vấn kỹ thuật / Chọn đồ',
    'Kiểm tra tồn kho vật tư',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        message: selectedTopic ? `[${selectedTopic}] ${formData.message.trim()}` : formData.message.trim(),
      };

      await api.post('/api/contact', payload);

      toast.success('Cảm ơn bạn! Trường Tín đã nhận được thông tin và sẽ phản hồi sớm nhất.');
      setFormData({ name: '', phone: '', message: '' });
    } catch (error) {
      console.error('Lỗi gửi liên hệ:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại hoặc gọi hotline!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      {/* =================================================================
          1. BẢN ĐỒ GOOGLE MAPS ĐẶT NGAY ĐẦU TRANG (ĐẬP VÀO MẮT NGƯỜI DÙNG)
          ================================================================= */}
      <section className="position-relative border-bottom bg-light">
        <div className="w-100 position-relative" style={{ height: '440px' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62702.42529453964!2d106.62360754863278!3d10.818843400000011!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175294ee70e64cd%3A0x9123615e25378420!2zQ-G7rWEgSMOgbmcgVHLGsOG7nW5nIFTDrW4!5e0!3m2!1svi!2s!4v1772289833108!5m2!1svi!2s"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Bản đồ vị trí Cửa hàng Điện Nước Trường Tín 358 Nơ Trang Long"
          />

          {/* Floating pill badge trên bản đồ */}
          <div
            className="position-absolute top-0 start-50 translate-middle-x mt-3 px-3 py-2 bg-white rounded-pill shadow-lg border d-flex align-items-center gap-2"
            style={{ zIndex: 10, maxWidth: '92%' }}
          >
            <span className="badge bg-danger rounded-circle p-1.5 d-flex align-items-center justify-content-center">
              <i className="bi bi-geo-alt-fill text-white fs-6"></i>
            </span>
            <div className="text-truncate">
              <strong className="text-dark small d-block d-sm-inline me-1">Điện Nước Trường Tín:</strong>
              <span className="text-secondary small">358 Nơ Trang Long, P.13, Q. Bình Thạnh</span>
            </div>
            <a
              href="https://maps.google.com/?q=358+Nơ+Trang+Long,+Phường+13,+Bình+Thạnh,+Hồ+Chí+Minh"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm rounded-pill fw-bold text-nowrap px-3 py-1 ms-1 d-none d-sm-inline-flex align-items-center gap-1 shadow-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-signpost-2-fill"></i>
              <span>Chỉ Đường</span>
            </a>
          </div>
        </div>
      </section>

      {/* =================================================================
          2. NỘI DUNG CHÍNH: 2 CỘT (THÔNG TIN LIÊN HỆ & FORM GỬI TIN NHẮN)
          ================================================================= */}
      <section className="py-5" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container py-lg-2">
          <div className="row g-4 align-items-stretch">
            {/* -------------------------------------------------------------
                CỘT 1: THÔNG TIN CỬA HÀNG & CÁC KÊNH KẾT NỐI TRỰC TIẾP
                ------------------------------------------------------------- */}
            <div className="col-lg-6">
              <div className="contact-card-main p-4 p-md-5 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill fw-bold small">
                      TRỰC TIẾP TẠI TIỆM
                    </span>
                  </div>
                  <h2 className="fw-bolder text-dark mb-1" style={{ fontSize: '1.45rem' }}>
                    Cửa Hàng Điện Nước Trường Tín
                  </h2>
                  <p className="text-muted small mb-4">
                    Hơn 20 năm phục vụ bà con Bình Thạnh & TP.HCM. Ghé tiệm xem hàng thực tế hoặc liên hệ nhanh qua các kênh dưới đây:
                  </p>

                  <div className="d-flex flex-column gap-3 mb-4">
                    {/* Mục 1: Địa chỉ */}
                    <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border border-light">
                      <div className="contact-info-icon-box bg-primary bg-opacity-10 text-primary">
                        <i className="bi bi-geo-alt-fill"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>
                          Địa chỉ cửa hàng
                        </div>
                        <div className="text-secondary small mb-2" style={{ lineHeight: 1.5 }}>
                          <strong>358 Nơ Trang Long, Phường 13, Quận Bình Thạnh, TP.HCM</strong>
                          <br />
                          <span className="text-muted">(Gần ngã tư Nguyễn Xí & Nơ Trang Long, đối diện Cầu Bình Lợi cũ)</span>
                        </div>
                        <a
                          href="https://maps.google.com/?q=358+Nơ+Trang+Long,+Phường+13,+Bình+Thạnh,+Hồ+Chí+Minh"
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary rounded-pill fw-semibold px-3 py-1 d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-map"></i>
                          <span>Mở Bản Đồ Chỉ Đường</span>
                        </a>
                      </div>
                    </div>

                    {/* Mục 2: Hotline & Zalo */}
                    <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border border-light">
                      <div className="contact-info-icon-box bg-warning bg-opacity-15 text-warning-emphasis">
                        <i className="bi bi-telephone-fill" style={{ color: '#ea580c' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>
                          Điện thoại / Hotline / Zalo
                        </div>
                        <div className="text-secondary small mb-2">
                          <strong className="text-primary fs-6">0903 989 096</strong> (Mr. Tín - Hỗ trợ kỹ thuật & Kiểm kho)
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <a
                            href="tel:0903989096"
                            className="btn btn-sm btn-danger rounded-pill fw-semibold px-3 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
                          >
                            <i className="bi bi-telephone-outbound-fill"></i>
                            <span>Gọi Ngay</span>
                          </a>
                          <a
                            href="https://zalo.me/0903989096"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-primary rounded-pill fw-semibold px-3 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
                            style={{ backgroundColor: '#0068ff', borderColor: '#0068ff' }}
                          >
                            <i className="bi bi-chat-dots-fill"></i>
                            <span>Nhắn Tin Zalo</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Mục 3: Thời gian phục vụ & Email */}
                    <div className="d-flex align-items-start gap-3 p-3 rounded-3 bg-light border border-light">
                      <div className="contact-info-icon-box bg-success bg-opacity-10 text-success">
                        <i className="bi bi-clock-fill"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>
                          Giờ làm việc & Email
                        </div>
                        <div className="text-secondary small mb-1">
                          ⏰ <strong>7h00 – 18h30</strong> (Thứ 2 – Chủ Nhật, mở cửa cả ngày lễ)
                        </div>
                        <div className="text-secondary small">
                          ✉️ Email:{' '}
                          <a href="mailto:ben0903989690@gmail.com" className="text-decoration-none fw-semibold text-primary">
                            ben0903989690@gmail.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cam kết phục vụ */}
                <div className="pt-3 border-top border-slate-200">
                  <div className="row g-2 text-center text-sm-start">
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>Có chỗ đậu xe máy & xe tải</span>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>Xuất hóa đơn & Toa hàng sỉ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                CỘT 2: FORM LIÊN HỆ ĐỒNG BỘ UI
                ------------------------------------------------------------- */}
            <div className="col-lg-6">
              <div className="contact-card-main p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold small">
                    HỖ TRỢ NHANH
                  </span>
                </div>
                <h3 className="fw-bolder text-dark mb-1" style={{ fontSize: '1.45rem' }}>
                  Gửi Yêu Cầu Tư Vấn & Báo Giá
                </h3>
                <p className="text-muted small mb-3">
                  Để lại thông tin và yêu cầu của bạn, Trường Tín sẽ phản hồi trong vòng 15 phút.
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Chọn chủ đề / nhu cầu nhanh */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark mb-1.5" style={{ fontSize: '0.82rem' }}>
                      Bạn cần hỗ trợ việc gì?
                    </label>
                    <div className="d-flex flex-wrap gap-1.5">
                      {topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          className={`contact-topic-chip ${selectedTopic === topic ? 'active' : ''}`}
                          onClick={() => setSelectedTopic(topic)}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Họ và tên & Số điện thoại trên 2 cột */}
                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.84rem' }}>
                        Họ và tên <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control contact-input-custom"
                        placeholder="Ví dụ: Anh Nam, Chị Mai..."
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.84rem' }}>
                        Số điện thoại / Zalo <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control contact-input-custom"
                        placeholder="Ví dụ: 0901234567..."
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Nội dung cần hỗ trợ */}
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '0.84rem' }}>
                      Nội dung tin nhắn / Danh sách vật tư cần báo giá <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control contact-input-custom"
                      rows={4}
                      placeholder="Ví dụ: Tôi cần báo giá sỉ 10 cuộn Cadivi 2.5, 20 ống Bình Minh phi 27, giao về đường Chu Văn An Bình Thạnh..."
                      style={{ resize: 'vertical' }}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {/* Nút gửi form đồng bộ với style nút brand */}
                  <div className="d-flex flex-column flex-sm-row align-items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-brand-primary-contact px-4 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2 flex-grow-1 w-100"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          <span>Đang gửi thông tin...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill"></i>
                          <span>GỬI YÊU CẦU CHO TRƯỜNG TÍN</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-3">
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      🔒 Thông tin của bạn được bảo mật tuyệt đối và chỉ dùng để liên hệ báo giá.
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          3. 3 LỢI THẾ & TIỆN ÍCH KHI GHÉ CỬA HÀNG TRƯỜNG TÍN
          ================================================================= */}
      <section className="py-5" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="contact-feature-box h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-3 shadow-sm"
                  style={{ width: '44px', height: '44px', backgroundColor: '#0078d4' }}
                >
                  <i className="bi bi-truck fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.05rem' }}>
                  Giao Nhanh Tận Nơi
                </h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  Hỗ trợ chở ống nước dài, dây cáp nặng tận công trình hoặc địa chỉ nhà bạn tại Bình Thạnh, Thủ Đức, Gò Vấp.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="contact-feature-box h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-3 shadow-sm"
                  style={{ width: '44px', height: '44px', backgroundColor: '#16a34a' }}
                >
                  <i className="bi bi-qr-code-scan fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.05rem' }}>
                  Thanh Toán Linh Hoạt
                </h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  Chấp nhận thanh toán tiền mặt, chuyển khoản quét mã VietQR tự động, thanh toán online PayOS tiện lợi.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="contact-feature-box h-100">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-3 shadow-sm"
                  style={{ width: '44px', height: '44px', backgroundColor: '#ea580c' }}
                >
                  <i className="bi bi-arrow-repeat fs-5"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.05rem' }}>
                  Hỗ Trợ Đổi Trả Linh Hoạt
                </h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  Lỡ mua dư phụ kiện co lơn hoặc nhầm cỡ ống nước? Trường Tín hỗ trợ đổi lại dễ dàng khi đồ còn mới nguyên.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}