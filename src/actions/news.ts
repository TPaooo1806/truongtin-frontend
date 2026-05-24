'use server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function fetchNews() {
  try {
    // Lấy tin từ nhiều nguồn để có đủ dữ liệu lọc
    const urls = [
      'https://baoxaydung.vn/rss/xay-dung/vat-lieu-xay-dung.rss',
      'https://vnexpress.net/rss/kinh-doanh.rss',
      'https://vnexpress.net/rss/bat-dong-san.rss'
    ];

    let allItems: any[] = [];
    
    // Fetch tất cả các feeds (dùng Promise.allSettled để tránh lỗi 1 link làm sập tất cả)
    const responses = await Promise.allSettled(
      urls.map(url => fetch(url, { next: { revalidate: 3600 } }).then(res => res.text()))
    );

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        const feed = await parser.parseString(res.value);
        allItems = [...allItems, ...feed.items];
      }
    }

    // Từ khóa liên quan đến TPHCM, giá cả, điện nước, vật liệu
    const keywords = ['tp.hcm', 'hcm', 'hồ chí minh', 'giá', 'điện', 'nước', 'vật liệu', 'thép', 'xi măng', 'cát', 'bất động sản'];

    // Lọc tin tức chứa từ khóa trong tiêu đề hoặc nội dung
    const filteredNews = allItems.filter(item => {
      const text = `${item.title} ${item.contentSnippet || ''} ${item.description || ''}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });

    // Nếu lọc ra ít hơn 5 tin, lấy thêm các tin khác bù vào cho đủ 5
    let finalNews = filteredNews;
    if (finalNews.length < 5) {
      const otherNews = allItems.filter(item => !finalNews.includes(item));
      finalNews = [...finalNews, ...otherNews.slice(0, 5 - finalNews.length)];
    }

    // Trả về tối đa 15 bài
    return finalNews.slice(0, 15);
  } catch (error) {
    console.error("Lỗi hút tin tức:", error);
    return [];
  }
}
