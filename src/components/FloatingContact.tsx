"use client";
import React from "react";

export default function FloatingContact() {
  // 💡 Thay số điện thoại thực tế của cửa hàng vào đây
  const phoneNumber = "0903989096"; // Dùng số hotline của Trường Tín
  const zaloLink = `https://zalo.me/${phoneNumber}`;

  return (
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 9999, marginBottom: "20px", marginRight: "10px" }}
    >
      <div className="d-flex flex-column gap-3">
        {/* Nút Zalo */}
        <a
          href={zaloLink}
          target="_blank"
          rel="noopener noreferrer"
          className="d-flex align-items-center justify-content-center shadow-lg position-relative border-0"
          style={{
            width: "55px",
            height: "55px",
            backgroundColor: "#0068FF",
            borderRadius: "50%",
            transition: "all 0.3s ease",
          }}
          title="Chat Zalo với chúng tôi"
        >
          {/* Hiệu ứng vòng sóng lan tỏa ngầm định */}
          <span className="position-absolute top-0 start-0 w-100 h-100 rounded-circle animate-ping" 
                style={{ backgroundColor: "#0068FF", opacity: 0.4, animationDuration: '2s' }}></span>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" 
            alt="Zalo" 
            style={{ width: "32px", height: "32px", zIndex: 1 }}
          />
        </a>

        {/* Nút Gọi Điện Hotline */}
        <a
          href={`tel:${phoneNumber}`}
          className="d-flex align-items-center justify-content-center shadow-lg position-relative border-0 text-white"
          style={{
            width: "55px",
            height: "55px",
            backgroundColor: "#dc3545", // Màu đỏ Bootstrap
            borderRadius: "50%",
            transition: "all 0.3s ease",
          }}
          title="Gọi hotline tư vấn"
        >
          {/* Hiệu ứng vòng sóng nhấp nháy */}
          <span className="position-absolute top-0 start-0 w-100 h-100 rounded-circle animate-ping" 
                style={{ backgroundColor: "#dc3545", opacity: 0.4, animationDuration: '1.5s' }}></span>
          <i className="bi bi-telephone-fill fs-4" style={{ zIndex: 1 }}></i>
        </a>
      </div>

      {/* CSS Animation nhỏ gọn cho hiệu ứng ping tỏa sóng (nếu project chưa có sẵn Tailwind) */}
      <style jsx global>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          70%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
