export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Variant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Image {
  id?: number;
  url: string;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string;
  unit: string;
  isVisible: boolean;
  createdAt: string;
  category: Category;
  variants: Variant[];
  images: Image[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
