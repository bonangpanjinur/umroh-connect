// Database types for Arah Umroh

export type AppRole = 'jamaah' | 'agent' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Travel {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  rating: number;
  review_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  travel_id: string;
  name: string;
  description: string | null;
  duration_days: number;
  hotel_makkah: string | null;
  hotel_madinah: string | null;
  hotel_star: number;
  airline: string | null;
  flight_type: 'direct' | 'transit';
  meal_type: 'fullboard' | 'halfboard' | 'breakfast';
  facilities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  travel?: Travel;
  departures?: Departure[];
}

export interface Departure {
  id: string;
  package_id: string;
  departure_date: string;
  return_date: string;
  price: number;
  original_price: number | null;
  available_seats: number;
  total_seats: number;
  status: 'available' | 'limited' | 'full' | 'waitlist' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

// For package card display
export interface PackageWithDetails extends Package {
  travel: Travel;
  departures: Departure[];
}

// Membership types
export type MembershipPlan = 'basic' | 'premium' | 'enterprise';
export type MembershipStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface Membership {
  id: string;
  travel_id: string;
  plan_type: MembershipPlan;
  status: MembershipStatus;
  start_date: string | null;
  end_date: string | null;
  amount: number;
  payment_proof_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  travel?: Travel;
}

// Banner types
export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: 'home' | 'paket' | 'detail';
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  travel_id: string | null;
  created_at: string;
  updated_at: string;
}

// Package credits
export interface PackageCredits {
  id: string;
  travel_id: string;
  credits_remaining: number;
  credits_used: number;
  last_purchase_date: string | null;
  created_at: string;
  updated_at: string;
  travel?: Travel;
}

// Credit transactions
export type TransactionType = 'purchase' | 'usage' | 'bonus' | 'refund';

export interface CreditTransaction {
  id: string;
  travel_id: string;
  transaction_type: TransactionType;
  amount: number;
  price: number | null;
  package_id: string | null;
  notes: string | null;
  created_at: string;
  travel?: Travel;
}

// Platform settings
export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_at: string;
}

// Admin stats
export interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  totalTravels: number;
  totalPackages: number;
  activeMembers: number;
  pendingMembers: number;
  totalRevenue: number;
}
