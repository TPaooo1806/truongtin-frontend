import Sidebar from '../components/Sidebar';

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container my-4">
      <div className="row g-4">
        {/* VẤN ĐỀ 1: SIDEBAR CỐ ĐỊNH Ở CẤP LAYOUT -> KHÔNG UNMOUNT / KHÔNG RESET SCROLL KHI CHUYỂN DANH MỤC */}
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>

        {/* NỘI DUNG LƯỚI SẢN PHẨM BÊN PHẢI */}
        <div className="col-lg-9">
          {children}
        </div>
      </div>
    </div>
  );
}

