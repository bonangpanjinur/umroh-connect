// Database types for Arah Umroh

export type AppRole = 'jamaah' | 'agent' | 'admin';
export type TravelStatus = 'active' | 'suspended' | 'pending';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type PackageType = 'umroh' | 'haji_reguler' | 'haji_plus' | 'haji_furoda';

export interface Profile {
  id: string;
  user_id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
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
  verified_at: string | null;
  verified_by: string | null;
  approval_notes: string | null;
  status: TravelStatus;
  admin_approved_slug?: string | null;
  is_custom_url_enabled_by_admin?: boolean;
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
  hotel_makkah_id?: string | null;
  hotel_madinah: string | null;
  hotel_madinah_id?: string | null;
  hotel_star: number;
  airline: string | null;
  airline_id?: string | null;
  flight_type: 'direct' | 'transit';
  meal_type: 'fullboard' | 'halfboard' | 'breakfast';
  facilities: string[];
  images: string[];
  is_active: boolean;
  package_type: PackageType;
  base_price?: number | null;
  // Haji-specific fields
  haji_year?: number | null;
  haji_season?: string | null;
  quota_type?: string | null;
  estimated_departure_year?: number | null;
  min_dp?: number | null;
  registration_deadline?: string | null;
  age_requirement?: string | null;
  health_requirements?: string[] | null;
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

// Master data types
export interface Hotel {
  id: string;
  name: string;
  city: 'Makkah' | 'Madinah';
  star_rating: number;
  distance_to_haram: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Airline {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Filter types for package listing
export interface PackageFilters {
  search: string;
  minPrice: number | null;
  maxPrice: number | null;
  months: number[];
  hotelStars: number[];
  flightType: 'all' | 'direct' | 'transit';
  duration: 'all' | 'short' | 'medium' | 'long';
  packageType: 'all' | PackageType;
}

// Agent application for registration
export interface AgentApplication {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  travel_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  documents: string[];
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Checklist types
export type ChecklistCategory = 'dokumen' | 'perlengkapan' | 'kesehatan' | 'mental';

export interface Checklist {
  id: string;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  phase: string;
  priority: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserChecklist {
  id: string;
  user_id: string;
  checklist_id: string;
  is_checked: boolean;
  checked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistWithProgress extends Checklist {
  userProgress?: UserChecklist;
}

export type SlugStatus = 'pending' | 'approved' | 'rejected';

export interface AgentWebsiteSettings {
  user_id: string;
  slug: string | null;
  custom_slug: string | null;
  slug_status: SlugStatus;
  admin_notes: string | null;
  is_builder_active: boolean;
  html_content: string | null;
  is_custom_url_active: boolean;
  is_pro_active: boolean;
  is_published: boolean;
  fb_pixel_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_image_url: string | null;
  primary_color?: string | null;
  hero_title?: string | null;
  hero_description?: string | null;
  hero_image_url?: string | null;
  show_stats?: boolean;
  show_features?: boolean;
  show_contact_form?: boolean;
  features_json?: any;
  active_template_id?: string | null;
  created_at: string;
  updated_at: string;
}


export interface WebsiteTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
}

// Update AgentWebsiteSettings to include active_template_id
// Note: In TypeScript, we can extend the interface or just add the field if it's already defined.
// Since it's already defined above, I will use 'edit' to add the field in the next step if needed, 
// but for now I'll just append the new interface.
