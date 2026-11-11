export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  showOnHome?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  _count?: {
    products: number;
  };
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
  brand?: string;
  description: string;
  unit: string;
  isVisible: boolean;
  isBulky?: boolean;
  createdAt: string;
  category: Category;
  variants: Variant[];
  images: Image[];
  attributes?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
