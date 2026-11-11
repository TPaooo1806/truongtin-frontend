'use server';

import Parser from 'rss-parser';
import { CURATED_NEWS, NewsItem } from '@/data/curated-news';

const parser = new Parser();

// NHÓM 5: BỘ TỪ KHÓA LOẠI TRỪ (Negative Keywords - Bắt buộc phải chặn)
const NEGATIVE_KEYWORDS = [
  // Chính sách & Quy hoạch cấp tỉnh/nhà nước
  'dự án nghìn tỷ', 'nghìn tỷ', 'thủ tướng', 'bộ xây dựng', 'phê duyệt quy hoạch', 
  'ngân sách tỉnh', 'ban quản lý dự án', 'cao tốc', 'giải phóng mặt bằng', 'metro',
  
  // Vật liệu nặng & Công nghiệp khai khoáng
  'mỏ đá', 'khai thác cát', 'xi măng công nghiệp', 'trạm trộn bê tông', 'xỉ than', 
  'nung clinker', 'clinker', 'bauxite', 'quặng sắt', 'nhựa đường', 'khoáng sản',
  
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
      'https://baoxaydung.vn/rss/xay-dung/vat-lieu-xay-dung.rss',
      'https://vnexpress.net/rss/thoi-su.rss',
      'https://vnexpress.net/rss/gia-dinh.rss',
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
          // Bỏ qua lỗi parse từng nguồn riêng lẻ
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
      .map((item) => ({
        title: item.title || '',
        link: item.link || '',
        description: item.contentSnippet || item.description || '',
        pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString('vi-VN') : '',
        category: 'Tin Thời Sự TP.HCM',
        isCurated: false,
      }));

    // KẾT HỢP VỚI CẨM NANG CỐ ĐỊNH TRƯỜNG TÍN (CURATED KNOWLEDGE BASE)
    // Đảm bảo loại bỏ hoàn toàn fallback lấy tin bừa và luôn có đủ 8 - 10 bài viết thực chiến
    const combinedNews: NewsItem[] = [...validRssNews];

    for (const curatedItem of CURATED_NEWS) {
      const isAlreadyIncluded = combinedNews.some(
        (n) => n.title.toLowerCase() === curatedItem.title.toLowerCase()
      );
      if (!isAlreadyIncluded) {
        combinedNews.push(curatedItem);
      }
    }

    return combinedNews.slice(0, 10);
  } catch (error) {
    console.error('Lỗi nạp tin tức:', error);
    // Nếu có lỗi mạng hoặc sập nguồn RSS, luôn trả về Cẩm nang chất lượng cao của Trường Tín
    return CURATED_NEWS;
  }
}
