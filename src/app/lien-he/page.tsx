'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';

// Lưu ý: Nếu dự án của bạn dùng thư viện toast khác (như react-toastify), hãy đổi import cho phù hợp
import toast from 'react-hot-toast'; 

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Gọi API gửi tin nhắn (Bảo chỉ cần viết route POST /api/contact ở backend là xong)
      await api.post('/api/contact', formData);
      
      // Giả sử API trả về { success: true }
      toast.success("Cảm ơn bạn! Tin nhắn đã được gửi đến Trường Tín.");
      setFormData({ name: '', phone: '', message: '' }); // Xóa trắng form sau khi gửi
      
    } catch (error) {
      console.error("Lỗi gửi liên hệ:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (


    
    <div className="container my-5">
      
      {/* BẢN ĐỒ GOOGLE MAPS (IFRAME) */}
      <h2 className="fw-bold text-uppercase text-danger">Vị trí cửa hàng chúng tôi</h2>
      <div className="rounded-4 overflow-hidden shadow-sm border p-1 bg-white" style={{ marginBottom: '40px' }}>
        {/* Dùng link iframe bạn vừa cung cấp */}
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62702.42529453964!2d106.62360754863278!3d10.818843400000011!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175294ee70e64cd%3A0x9123615e25378420!2zQ-G7rWEgSMOgbmcgVHLGsOG7nW5nIFTDrW4!5e0!3m2!1svi!2s!4v1772289833108!5m2!1svi!2s" 
          width="100%" 
          height="450" 
          style={{ border: 0, borderRadius: '12px' }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade">
        </iframe>
      </div>


      {/* TIÊU ĐỀ TRANG */}
      <div className="text-center mb-5">
        <h2 className="fw-bold text-uppercase text-danger">Liên hệ với chúng tôi</h2>
        <p className="text-muted">Bạn có thắc mắc hay cần báo giá sỉ? Hãy để lại thông tin nhé!</p>
      </div>

      <div className="row g-5 mb-5 align-items-stretch">
       {/* CỘT 1: FORM LIÊN HỆ */}
<div className="col-lg-6">
  <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border h-100">

    <h4 className="fw-bold mb-4">Gửi tin nhắn cho Trường Tín</h4>

    <form onSubmit={handleSubmit}>

      {/* Họ tên */}
      <div className="mb-4">
        <label className="form-label fw-semibold">
          Họ và tên <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Nhập tên của bạn"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
      </div>

      {/* SĐT */}
      <div className="mb-4">
        <label className="form-label fw-semibold">
          Số điện thoại <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className="form-control form-control-lg"
          placeholder="Ví dụ: 0901234567"
          required
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
      </div>

      {/* Nội dung */}
      <div className="mb-4">
        <label className="form-label fw-semibold">
          Nội dung cần hỗ trợ <span className="text-danger">*</span>
        </label>
        <textarea
          className="form-control form-control-lg"
          rows={5}
          placeholder="Ví dụ: Tôi cần báo giá sỉ cho 100 cuộn dây điện Cadivi..."
          style={{ resize: "vertical" }}
          required
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
        />
      </div>

      {/* Button */}
      <button
        type="submit"
        className="btn btn-danger fw-bold py-3 w-100 rounded-3 d-flex justify-content-center align-items-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            ĐANG GỬI...
          </>
        ) : (
          <>
            <i className="bi bi-send me-2"></i>
            GỬI TIN NHẮN
          </>
        )}
      </button>

    </form>

  </div>
</div>

        {/* CỘT 2: THÔNG TIN CỬA HÀNG */}
        <div className="col-lg-6">
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border h-100 d-flex flex-column justify-content-center">
            <h4 className="fw-bold mb-4">Thông tin liên hệ</h4>
            
            <div className="d-flex mb-4">
              <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-geo-alt fs-5"></i>
              </div>
              <div className="ms-3">
                <h6 className="fw-bold mb-1">Địa chỉ cửa hàng</h6>
                <p className="text-muted mb-0">Cửa hàng Điện Nước Trường Tín (Bình Thạnh, TP. HCM)</p>
              </div>
            </div>

            <div className="d-flex mb-4">
              <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-telephone fs-5"></i>
              </div>
              <div className="ms-3">
                <h6 className="fw-bold mb-1">Điện thoại / Hotline</h6>
                <a href="tel:0903989096" className="text-danger fw-bold text-decoration-none fs-5">
                  0903 989 096
                </a>
              </div>
            </div>

            <div className="d-flex mb-4">
              <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-envelope fs-5"></i>
              </div>
              <div className="ms-3">
                <h6 className="fw-bold mb-1">Email liên hệ</h6>
                <a href="mailto:ben0903989690@gmail.com" className="text-muted text-decoration-none">
                  ben0903989690@gmail.com
                </a>
              </div>
            </div>

            <div className="d-flex mb-4">
              <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-clock fs-5"></i>
              </div>
              <div className="ms-3">
                <h6 className="fw-bold mb-1">Giờ mở cửa</h6>
                <p className="text-muted mb-0">Thứ 2 - Chủ Nhật: Từ 7h30 đến 17h30</p>
              </div>
            </div>

            <hr className="my-2" />
            
            {/* CHIA SẺ MẠNG XÃ HỘI */}
            <div className="d-flex align-items-center mt-3">
              <span className="fw-bold me-3 text-dark">Kết nối ngay:</span>
              
              {/* Nút Facebook */}
              <a 
                href="https://facebook.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm" 
                style={{ width: '42px', height: '42px' }}
                title="Facebook"
              >
                <i className="bi bi-facebook fs-5"></i>
              </a>

              {/* Nút Zalo (Sử dụng link zalo.me/sdt) */}
              <a 
                href="https://zalo.me/0903989096" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-info text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                style={{ width: '42px', height: '42px', backgroundColor: '#0068ff', borderColor: '#0068ff' }}
                title="Zalo"
              >
                <strong className="fs-6" style={{ fontFamily: 'sans-serif' }}>Z</strong>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}