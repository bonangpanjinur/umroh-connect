export interface SellerProfile {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  is_verified: boolean;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerApplication {
  id: string;
  user_id: string;
  shop_name: string;
  description: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  documents: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerMembershipPlan {
  id: string;
  name: string;
  description: string | null;
  max_products: number;
  max_featured: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SellerMembership {
  id: string;
  seller_id: string;
  plan_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  payment_proof_url: string | null;
  amount: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  plan?: SellerMembershipPlan;
}

export interface SellerCredits {
  id: string;
  seller_id: string;
  credits_remaining: number;
  credits_used: number;
  last_purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  review_text: string | null;
  is_published: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerFeaturedProduct {
  id: string;
  seller_id: string;
  product_id: string;
  position: string;
  priority: number;
  credits_used: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}
