import Image from "next/image";
import Link from "next/link";
import type { Metadata } from 'next';
import './about.css';

export const metadata: Metadata = {
  title: 'Giới thiệu | Điện Nước Trường Tín',
  description: 'Điện Nước Trường Tín - Hơn 20 Năm Kiến Tạo Niềm Tin. Tổng kho phân phối vật tư Điện - Nước - Mộc - Kim khí uy tín hàng đầu.',
};

export default function AboutPage() {
  return (
    <main className="about-page">
      {/* 1. HERO SECTION */}
      <section className="hero-banner position-relative text-white text-center d-flex align-items-center justify-content-center" style={{ minHeight: "450px", backgroundColor: "#1a2a3a", overflow: "hidden" }}>
        <div className="position-absolute w-100 h-100" style={{ opacity: 0.2 }}>
           {/* Placeholder for Store Image */}
           <div className="w-100 h-100 bg-dark d-flex align-items-center justify-content-center">
              <span className="text-secondary">[Store Image Placeholder - 1920x500]</span>
           </div>
        </div>
        <div className="container position-relative z-index-1 px-3">
          <h1 className="display-4 fw-bold mb-4" style={{ letterSpacing: "-1px" }}>Điện Nước Trường Tín <br className="d-none d-md-block" /> Hơn 20 Năm Kiến Tạo Niềm Tin</h1>
          <p className="lead mx-auto fw-light" style={{ maxWidth: "800px", fontSize: "1.25rem" }}>
            Tổng kho phân phối vật tư Điện - Nước - Mộc - Kim khí uy tín hàng đầu.
          </p>
        </div>
      </section>

      {/* 2. VỀ CHÚNG TÔI (ABOUT US) */}
      <section className="our-story py-5">
        <div className="container py-md-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="rounded-4 overflow-hidden shadow bg-light d-flex align-items-center justify-content-center position-relative" style={{ minHeight: "450px" }}>
                 <span className="text-muted">[About Us Image Placeholder - 800x600]</span>
              </div>
            </div>
            <div className="col-lg-6 ps-lg-5">
              <h2 className="fw-bold mb-4" style={{ color: "#0078D4" }}>Về Chúng Tôi</h2>
              <div className="title-divider bg-danger mb-4" style={{ height: "4px", width: "60px", borderRadius: "2px" }}></div>
              <p className="text-secondary lh-lg mb-4 fs-5" style={{ textAlign: "justify" }}>
                Với bề dày kinh nghiệm hơn 20 năm hoạt động trong lĩnh vực cung cấp vật tư kỹ thuật, Cửa hàng Điện Nước Trường Tín tự hào là đối tác chiến lược và là người bạn đồng hành đáng tin cậy của hàng ngàn công trình lớn nhỏ tại khu vực Thủ Đức và trên toàn TP.HCM.
              </p>
              <p className="text-secondary lh-lg mb-0 fs-5" style={{ textAlign: "justify" }}>
                Chúng tôi thấu hiểu sâu sắc đặc thù của ngành xây dựng và luôn không ngừng tối ưu hóa chuỗi cung ứng để mang đến những giá trị thiết thực nhất cho khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THẾ MẠNH CỐT LÕI (CORE STRENGTHS) */}
      <section className="core-values py-5 bg-light">
        <div className="container py-md-5">
          <div className="text-center mb-5 pb-3">
            <h2 className="fw-bold mb-3">Thế Mạnh Cốt Lõi</h2>
            <div className="title-divider bg-primary mb-4 mx-auto" style={{ height: "4px", width: "80px", borderRadius: "2px" }}></div>
          </div>
          <div className="row g-4">
            {/* Item 1 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4 p-xl-5 hover-scale transition-all bg-white rounded-4">
                <div className="card-body p-0">
                  <div className="icon-wrapper bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "90px", height: "90px" }}>
                    <i className="bi bi-people-fill" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 className="fw-bold mb-3 fs-5">Phục vụ toàn diện (Sỉ & Lẻ)</h4>
                  <p className="text-secondary mb-0 lh-base">
                    Dù bạn là khách hàng cá nhân mua lẻ để sửa chữa dân dụng, hay nhà thầu cần nhập số lượng lớn, Trường Tín luôn sẵn sàng phục vụ với thái độ chuyên nghiệp và tận tâm nhất.
                  </p>
                </div>
              </div>
            </div>
            {/* Item 2 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4 p-xl-5 hover-scale transition-all bg-white rounded-4">
                <div className="card-body p-0">
                  <div className="icon-wrapper bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "90px", height: "90px" }}>
                    <i className="bi bi-cash-coin" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 className="fw-bold mb-3 fs-5">Giá sỉ cực tốt cho thầu thợ</h4>
                  <p className="text-secondary mb-0 lh-base">
                    Tự hào là đại lý cấp cao của nhiều thương hiệu lớn, Trường Tín cam kết mang đến chính sách giá sỉ siêu cạnh tranh, chiết khấu cao giúp tối ưu hóa chi phí cho mọi nhà thầu và chủ đầu tư.
                  </p>
                </div>
              </div>
            </div>
            {/* Item 3 */}
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4 p-xl-5 hover-scale transition-all bg-white rounded-4">
                <div className="card-body p-0">
                  <div className="icon-wrapper bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "90px", height: "90px" }}>
                    <i className="bi bi-building-check" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 className="fw-bold mb-3 fs-5">Đa dạng vật tư - Chuẩn chung cư</h4>
                  <p className="text-secondary mb-0 lh-base">
                    Hệ sinh thái sản phẩm khổng lồ, bao quát mọi hạng mục điện, nước, kim khí. Đủ năng lực và nguồn hàng để cung cấp trọn gói cho các dự án quy mô lớn như tòa nhà văn phòng, chung cư.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION (CTA) */}
      <section className="cta py-5 text-white position-relative overflow-hidden" style={{ backgroundColor: "#0078D4" }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(45deg, #005A9E, #0078D4)", opacity: 0.9 }}></div>
        <div className="container py-md-5 text-center position-relative z-index-1">
          <h2 className="fw-bold mb-5 display-6">Bạn đang tìm nguồn cung cấp vật tư cho công trình sắp tới?</h2>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 gap-md-4">
            <a href="https://zalo.me/0903989096" target="_blank" rel="noopener noreferrer" className="btn btn-light btn-lg fw-bold px-5 rounded-pill shadow d-flex align-items-center justify-content-center gap-2 transition-all hover-scale-btn text-primary">
              <i className="bi bi-chat-dots-fill fs-5"></i>
              Xem bảng giá sỉ
            </a>
            <Link href="/san-pham" className="btn btn-outline-light btn-lg fw-bold px-5 rounded-pill d-flex align-items-center justify-content-center gap-2 transition-all hover-scale-btn">
              <i className="bi bi-box-seam fs-5"></i>
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
