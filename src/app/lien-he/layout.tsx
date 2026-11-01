import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liên Hệ Cửa Hàng Điện Nước Trường Tín | 358 Nơ Trang Long, Bình Thạnh',
  description: 'Liên hệ Cửa hàng Vật Tư Điện Nước Trường Tín tại 358 Nơ Trang Long, P.13, Bình Thạnh, TP.HCM. Hotline & Zalo: 0903 989 096 (Mr. Tín). Báo giá sỉ cho thợ và tư vấn mua lẻ nhanh chóng.',
  keywords: [
    'liên hệ điện nước trường tín',
    'địa chỉ 358 nơ trang long',
    'số điện thoại điện nước bình thạnh',
    'báo giá vật tư điện nước',
    'zalo điện nước trường tín'
  ],
  openGraph: {
    title: 'Liên Hệ Cửa Hàng Điện Nước Trường Tín | 358 Nơ Trang Long, Bình Thạnh',
    description: 'Tư vấn kỹ thuật, báo giá sỉ & lẻ vật tư điện nước Cadivi, Bình Minh, Panasonic, MPE. Hotline/Zalo: 0903 989 096.',
    type: 'website',
  }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
