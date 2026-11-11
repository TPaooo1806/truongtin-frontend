export interface NewsItem {
  title: string;
  link: string;
  description?: string;
  contentSnippet?: string;
  imageUrl?: string;
  category?: string;
  pubDate?: string;
  isCurated?: boolean;
}

export const CURATED_NEWS: NewsItem[] = [
  {
    title: "Cách chọn tiết diện dây điện Cadivi đi âm tường cho nhà phố TP.HCM",
    link: "/san-pham",
    description: "Bảng tra công suất thiết bị gia đình (bếp từ, máy lạnh, máy nước nóng) giúp chọn đúng dây 1.5mm, 2.5mm, 4.0mm hoặc 6.0mm, tránh chập cháy và quá tải mùa nóng.",
    category: "Cẩm Nang Điện",
    pubDate: "Hôm nay",
    imageUrl: "/images/cadivi.png",
    isCurated: true,
  },
  {
    title: "Bí quyết dán ống nhựa uPVC Bình Minh chịu áp lực cao không rò rỉ nước",
    link: "/san-pham",
    description: "Quy trình 4 bước làm sạch mối nối, quét keo dán PVC Bình Minh chuẩn kỹ thuật và thời gian khô để đường ống chịu được áp lực máy bơm tăng áp mini.",
    category: "Mẹo Ống Nước",
    pubDate: "Hôm qua",
    imageUrl: "/images/ongnuoc.png",
    isCurated: true,
  },
  {
    title: "Xử lý triệt để sự cố phao cơ bồn nước không ngắt & tràn bồn trên mái nhà",
    link: "/san-pham",
    description: "Hướng dẫn tự kiểm tra gioăng cao su, thay phao cơ bồn nước inox và lắp đặt phao điện Radar tự ngắt máy bơm, chấm dứt lãng phí nước sinh hoạt.",
    category: "Cứu Hộ Nước",
    pubDate: "2 ngày trước",
    imageUrl: "/images/co-21.webp",
    isCurated: true,
  },
  {
    title: "Kinh nghiệm phân biệt dây cáp điện Cadivi thật và giả chính xác 100%",
    link: "/san-pham",
    description: "4 dấu hiệu nhận biết cuộn dây Cadivi chính hãng: màu sắc vỏ bọc PVC bóng đều dai dẻo, lõi đồng đỏ nguyên chất xoắn chặt, in dập laser sắc nét và tem niêm phong.",
    category: "Thẩm Định Hàng Thật",
    pubDate: "3 ngày trước",
    imageUrl: "/images/cadivi.png",
    isCurated: true,
  },
  {
    title: "An toàn điện mùa mưa và đối phó triều cường ngập nước tại Bình Thạnh",
    link: "/lien-he",
    description: "Lưu ý sống còn khi nước tràn vào nhà: nâng cao ổ cắm điện nổi trên mép triều cường, lắp cầu dao chống giật RCBO/ELCB và bảo trì aptomat chống rò rỉ tường.",
    category: "Bình Thạnh & Đời Sống",
    pubDate: "4 ngày trước",
    imageUrl: "/images/mat-tien-truong-tin.jpg",
    isCurated: true,
  },
  {
    title: "Cách dán keo chống dột mái tôn và trám khe nứt với keo Apollo Silicone",
    link: "/san-pham",
    description: "Mẹo sử dụng keo silicon Apollo A500 chống thấm khe cửa sổ, xử lý đầu đinh vít mái tôn bị gỉ sét và ngăn mùi hôi cống thoát sàn nhà vệ sinh triệt để.",
    category: "Mẹo Sửa Nhà",
    pubDate: "5 ngày trước",
    imageUrl: "/images/rp7.png",
    isCurated: true,
  },
  {
    title: "Aptomat (CB) nhảy liên tục mùa nắng nóng: Nguyên nhân & cách xử lý",
    link: "/lien-he",
    description: "Phân biệt hiện tượng nhảy do quá tải dòng điện máy lạnh hay do rò rỉ điện âm tường. Cách nâng cấp aptomat nhánh Panasonic/Sino an toàn.",
    category: "Cẩm Nang Điện",
    pubDate: "6 ngày trước",
    imageUrl: "/images/cadivi.png",
    isCurated: true,
  },
  {
    title: "Bảng danh mục vật tư điện nước cần mua khi xây sửa nhà phố tại TP.HCM",
    link: "/lien-he",
    description: "Kinh nghiệm bóc tách khối lượng ống nước Bình Minh, co lơi cút nối, dây điện Cadivi, đế âm Sino và van khóa để nhận giá sỉ đại lý tốt nhất.",
    category: "Kinh Nghiệm Xây Dựng",
    pubDate: "1 tuần trước",
    imageUrl: "/images/STORE_IMAGE_URL.webp",
    isCurated: true,
  },
];

