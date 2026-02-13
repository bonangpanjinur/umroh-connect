export type ShopOrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  weight_gram: number | null;
  thumbnail_url: string | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: ShopCategory;
}

export interface ShopCart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShopCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: ShopProduct;
}

export interface ShopOrder {
  id: string;
  user_id: string;
  order_code: string;
  status: ShopOrderStatus;
  total_amount: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  notes: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  tracking_number: string | null;
  courier: string | null;
  created_at: string;
  updated_at: string;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface CartItemWithProduct extends ShopCartItem {
  product: ShopProduct;
}
