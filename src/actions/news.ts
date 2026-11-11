'use server';

import Parser from 'rss-parser';
import { CURATED_NEWS, NewsItem } from '@/data/curated-news';

const parser = new Parser();

// Bộ ảnh dự phòng cục bộ sắc nét 100% không lo lỗi link/403
const FALLBACK_NEWS_IMAGES = [
  "/images/cadivi.png",
  "/images/ongnuoc.png",
  "/images/mat-tien-truong-tin.jpg",
  "/images/STORE_IMAGE_URL.webp",
  "/images/rp7.png",
  "/images/co-21.webp",
];

// NHÓM 5: BỘ TỪ KHÓA LOẠI TRỪ (Negative Keywords - Bắt buộc phải chặn)
const NEGATIVE_KEYWORDS = [
  // Chính sách & Quy hoạch cấp tỉnh/nhà nước
  'dự án nghìn tỷ', 'nghìn tỷ', 'thủ tướng', 'bộ xây dựng', 'phê duyệt quy hoạch', 
  'ngân sách tỉnh', 'ban quản lý dự án', 'cao tốc', 'giải phóng mặt bằng', 'metro',
  'hạ tầng trọng điểm', 'đề án', 'tham vấn', 'nguồn cung vật liệu', 'thụy sĩ',
  'insee', 'saca',
  
  // Vật liệu nặng & Công nghiệp khai khoáng
  'mỏ đá', 'khai thác cát', 'xi măng công nghiệp', 'trạm trộn bê tông', 'xỉ than', 
  'nung clinker', 'clinker', 'bauxite', 'quặng sắt', 'nhựa đường', 'khoáng sản',
  'vật liệu không nung', 'tái chế', 'chất thải', 'chất thải xây dựng', 'chất thải rắn',
  
  // Địa phương xa (ngoài TP.HCM)
  'bắc ninh', 'quảng ngãi', 'hà nội', 'lạng sơn', 'thanh hóa', 'nghệ an', 'hải phòng', 
  'vĩnh phúc', 'thái nguyên', 'quảng ninh', 'bắc giang', 'hà nam', 'nam định', 
  'ninh bình', 'thái bình', 'hòa bình', 'yên bái', 'phú thọ', 'sơn la', 'lai châu',
  
  // Hạ tầng lớn
  'thủy điện', 'điện gió ngoài khơi', 'nhiệt điện than', 'nhiệt điện', 'đập ngăn mặn', 'cầu vượt biển'
];

// NHÓM 1, 2, 3, 4: BỘ TỪ KHÓA TÍCH CỰC (Positive Keywords)
const POSITIVE_KEYWORDS = [
  // Nhóm 1: Điện dân dụng & Mẹo sự cố
  'chập điện', 'aptomat', 'cb chống giật', 'rò rỉ điện', 'điện giật', 'ổ cắm', 'công tắc', 
  'quá tải điện', 'tiết diện dây điện', 'công suất dây điện', 'bảng điện', 'đấu công tắc', 
  'đèn led', 'dây điện âm tường', 'công tắc sino', 'panasonic', 'mcb', 'cadivi', 'daphaco',
  
  // Nhóm 2: Nước & Vệ sinh gia đình
  'ống nước', 'rò rỉ nước', 'bồn cầu', 'rỉ nước', 'van khóa nước', 'phao cơ', 'tràn bồn nước', 
  'nước chảy yếu', 'nghẹt ống', 'mùi hôi cống', 'thay phao cơ', 'phao điện', 'máy bơm', 
  'ống nhựa pvc', 'ống upvc', 'keo lụa', 'vòi xịt', 'ruột gà', 'bơm tăng áp', 'bình minh', 
  'ống ppr', 'co lơi', 'cút nối', 'phao radar', 'vòi hồ',
  
  // Nhóm 3: Đời sống, Nhà phố & Đặc thù Bình Thạnh - TP.HCM
  'bình thạnh', 'nhà phố', 'tp.hcm', 'tphcm', 'hồ chí minh', 'sửa nhà', 'cải tạo nhà', 
  'nâng nền', 'chống ngập', 'triều cường', 'mùa mưa', 'chống ẩm mốc', 'chống dột', 
  'mái tôn', 'apollo silicone', 'keo silicone',
  
  // Nhóm 4: Cẩm nang vật tư & Tiêu chuẩn hàng thật
  'phân biệt cadivi', 'cadivi thật giả', 'dây điện thật giả', 'ống nhựa bình minh', 
  'vật tư xây nhà', 'vật tư điện nước', 'bảng giá dây điện'
];

export async function fetchNews(): Promise<NewsItem[]> {
  try {
    const urls = [
      'https://vnexpress.net/rss/gia-dinh.rss',
      'https://vnexpress.net/rss/thoi-su.rss',
    ];

    let allRssItems: any[] = [];

    // Fetch các feeds RSS an toàn
    const responses = await Promise.allSettled(
      urls.map((url) =>
        fetch(url, { next: { revalidate: 3600 } }).then((res) => res.text())
      )
    );

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        try {
          const feed = await parser.parseString(res.value);
          if (feed?.items) {
            allRssItems = [...allRssItems, ...feed.items];
          }
        } catch {
          // Bỏ qua lỗi parse từng nguồn
        }
      }
    }

    // BỘ LỌC ĐA TẦNG (MULTI-TIER FILTERING)
    const validRssNews: NewsItem[] = allRssItems
      .filter((item) => {
        const fullText = `${item.title || ''} ${item.contentSnippet || ''} ${item.description || ''}`.toLowerCase();

        // TẦNG 1: CHẶN TUYỆT ĐỐI (Negative Keywords)
        const hasNegative = NEGATIVE_KEYWORDS.some((badKw) => fullText.includes(badKw));
        if (hasNegative) return false;

        // TẦNG 2: LỌC TÍCH CỰC (Positive Keywords)
        const hasPositive = POSITIVE_KEYWORDS.some((goodKw) => fullText.includes(goodKw));
        return hasPositive;
      })
      .map((item, idx) => {
        // Trích xuất link ảnh từ enclosure hoặc regex HTML
        let imgUrl = item.enclosure?.url;
        if (!imgUrl) {
          const match = (item.description || item.content || '').match(/src=["'](.*?)["']/);
          if (match && match[1] && match[1].startsWith('http')) {
            imgUrl = match[1];
          }
        }
        // Nếu không có ảnh hoặc ảnh tương đối, dùng ảnh Unsplash chất lượng cao
        if (!imgUrl) {
          imgUrl = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
        }

        return {
          title: item.title || '',
          link: item.link || '',
          description: (item.contentSnippet || item.description || '').replace(/<[^>]*>?/gm, '').trim(),
          pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString('vi-VN') : 'Mới cập nhật',
          imageUrl: imgUrl,
          category: 'Tin Thời Sự TP.HCM',
          isCurated: false,
        };
      });

    // ƯU TIÊN HIỂN THỊ CẨM NANG CHẤT LƯỢNG CAO TRƯỜNG TÍN LÊN ĐẦU
    // Để trang chủ luôn có sẵn 8 bài viết đẹp mắt, ảnh sắc nét 100% không bao giờ bị lỗi
    const combinedNews: NewsItem[] = [...CURATED_NEWS];

    for (const rssItem of validRssNews) {
      const isAlreadyIncluded = combinedNews.some(
        (n) => n.title.toLowerCase() === rssItem.title.toLowerCase()
      );
      if (!isAlreadyIncluded) {
        combinedNews.push(rssItem);
      }
    }

    return combinedNews.slice(0, 10);
  } catch (error) {
    console.error('Lỗi nạp tin tức:', error);
    // Nếu có lỗi, luôn trả về Cẩm nang chất lượng cao của Trường Tín
    return CURATED_NEWS;
  }
}
