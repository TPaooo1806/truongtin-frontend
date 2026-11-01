import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giới Thiệu Cửa Hàng Điện Nước Trường Tín | Hơn 20 Năm Uy Tín Bình Thạnh',
  description: 'Cửa hàng Điện Nước Trường Tín tại 358 Nơ Trang Long, Bình Thạnh - Hơn 20 năm phân phối vật tư điện nước, kim khí chính hãng Cadivi, Bình Minh, Panasonic, MPE. Mua lẻ giá tốt như mua sỉ, tư vấn tận tâm.',
  keywords: [
    'điện nước trường tín',
    'vật tư điện nước bình thạnh',
    '358 nơ trang long',
    'ống nhựa bình minh bình thạnh',
    'dây điện cadivi chính hãng',
    'thiết bị điện panasonic',
    'vật tư điện nước thủ đức'
  ],
  openGraph: {
    title: 'Điện Nước Trường Tín - Hơn 20 Năm Uy Tín Bình Thạnh & TP.HCM',
    description: 'Siêu thị vật tư điện nước dân dụng & công trình. Cần gì cũng có, mua lẻ giá tốt như mua sỉ. Tư vấn chuẩn xác, giao nhanh trong ngày.',
    images: [
      {
        url: '/images/mat-tien-truong-tin.jpg',
        width: 1200,
        height: 800,
        alt: 'Mặt tiền Cửa hàng Điện Nước Trường Tín 358 Nơ Trang Long'
      }
    ],
    type: 'website',
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
