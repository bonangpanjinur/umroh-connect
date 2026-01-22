// Travel/Agent Types
export interface Travel {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

// Package Types
export interface UmrohPackage {
  id: string;
  travel: Travel;
  name: string;
  description: string;
  duration: number; // in days
  hotelMakkah: string;
  hotelMadinah: string;
  hotelStar: number;
  airline: string;
  flightType: 'direct' | 'transit';
  mealType: 'fullboard' | 'halfboard' | 'breakfast';
  facilities: string[];
  images: string[];
  departures: PackageDeparture[];
}

export interface PackageDeparture {
  id: string;
  packageId: string;
  departureDate: string;
  returnDate: string;
  price: number;
  originalPrice?: number;
  availableSeats: number;
  totalSeats: number;
  status: 'available' | 'limited' | 'full' | 'waitlist';
}

// Prayer Times Types
export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface CurrentPrayer {
  name: string;
  time: string;
  nextPrayer: string;
  nextPrayerTime: string;
  countdown: string;
}

// Manasik/Guide Types
export interface ManasikStep {
  id: string;
  order: number;
  title: string;
  titleArabic?: string;
  type: 'rukun' | 'wajib' | 'sunnah';
  description: string;
  audioUrl?: string;
  imageUrl?: string;
  doaText?: string;
  doaArabic?: string;
  completed: boolean;
}

// User Types
export type UserRole = 'jamaah' | 'agent' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  travelId?: string; // Only for agent role
}

// Tab Types
export type TabId = 'home' | 'panduan' | 'paket' | 'akun';
