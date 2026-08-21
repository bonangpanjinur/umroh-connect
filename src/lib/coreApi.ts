import type { Departure, PackageWithDetails, Travel } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

const CORE_API_URL = (import.meta.env.VITE_CORE_API_URL || '/api/v1').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 10_000;

export class CoreApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, options: { status: number; code?: string; requestId?: string }) {
    super(message);
    this.name = 'CoreApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

async function request<T>(path: string, init?: RequestInit, authenticated = false): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const requestId = crypto.randomUUID();

  try {
    const session = authenticated ? (await supabase.auth.getSession()).data.session : null;
    const response = await fetch(`${CORE_API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body?.error;
      throw new CoreApiError(error?.message || `Core API request failed (${response.status})`, {
        status: response.status,
        code: error?.code,
        requestId: error?.request_id || response.headers.get('x-request-id') || requestId,
      });
    }
    return body?.data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new CoreApiError('Core API timeout', { status: 408, requestId });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

interface CoreListing {
  id: string;
  travel: { id: string | null; name: string | null; slug: string | null; verified: boolean };
  package: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    durationDays: number;
    photoUrl: string | null;
    departureCity: string | null;
    airline: string | null;
    facilities: unknown;
  };
  departure: {
    id: string;
    departureDate: string;
    returnDate: string | null;
    priceFrom: number;
    currency: string;
    availabilitySnapshot: number;
    status: string;
  };
  sponsored: boolean;
  publishedAt: string | null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toLegacyPackage(listing: CoreListing): PackageWithDetails {
  const pkg = listing.package;
  const departure: Departure = {
    id: listing.departure.id,
    package_id: pkg.id,
    departure_date: listing.departure.departureDate,
    return_date: listing.departure.returnDate || listing.departure.departureDate,
    price: listing.departure.priceFrom,
    original_price: null,
    available_seats: listing.departure.availabilitySnapshot,
    total_seats: listing.departure.availabilitySnapshot,
    status: listing.departure.status === 'published' ? 'available' : 'cancelled',
    created_at: listing.publishedAt || new Date().toISOString(),
    updated_at: listing.publishedAt || new Date().toISOString(),
  };

  const travel = {
    id: listing.travel.id || 'unknown',
    name: listing.travel.name || 'Travel Umroh',
    slug: listing.travel.slug || listing.travel.id || 'travel-umroh',
    verified: listing.travel.verified,
  } as Travel;

  return {
    id: pkg.id,
    travel_id: listing.travel.id || 'unknown',
    name: pkg.name,
    description: pkg.description,
    duration_days: pkg.durationDays,
    hotel_makkah: null,
    hotel_madinah: null,
    hotel_star: 0,
    airline: pkg.airline,
    flight_type: 'direct',
    meal_type: 'fullboard',
    facilities: asStringArray(pkg.facilities),
    images: pkg.photoUrl ? [pkg.photoUrl] : [],
    is_active: true,
    status: 'active',
    package_type: (pkg.type || 'umroh') as PackageWithDetails['package_type'],
    base_price: pkg ? listing.departure.priceFrom : null,
    created_at: listing.publishedAt || new Date().toISOString(),
    updated_at: listing.publishedAt || new Date().toISOString(),
    travel,
    departures: [departure],
  };
}

export const coreApi = {
  async listMarketplaceListings(params?: { q?: string; type?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    const suffix = search.toString() ? `?${search.toString()}` : '';
    const listings = await request<CoreListing[]>(`/marketplace/listings${suffix}`);
    return listings.map(toLegacyPackage);
  },

  async getMarketplaceListing(departureId: string) {
    const listing = await request<CoreListing>(`/marketplace/listings/${encodeURIComponent(departureId)}`);
    return toLegacyPackage(listing);
  },

  async createCheckoutSession(input: { packageId?: string; departureId: string; pax: number; contact?: Record<string, unknown> }, idempotencyKey: string) {
    return request<{
      id: string;
      package_id: string | null;
      departure_id: string;
      pax: number;
      status: string;
      expires_at: string;
      created_at: string;
    }>('/marketplace/checkout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }, true);
  },

  async getMarketplacePackage(packageId: string) {
    const listing = await request<CoreListing>(`/marketplace/packages/${encodeURIComponent(packageId)}`);
    return toLegacyPackage(listing);
  },

  async createPaymentOrder(sessionId: string) {
    return request<{ id: string; external_id: string; provider: string; amount: number; status: string; payment_url: string | null; expires_at: string }>(`/marketplace/checkout-sessions/${encodeURIComponent(sessionId)}/payment-order`, { method: 'POST' }, true);
  },

  async getPaymentOrder(sessionId: string) {
    return request<{ id: string; external_id: string; provider: string; amount: number; status: string; payment_url: string | null; expires_at: string }>(`/marketplace/checkout-sessions/${encodeURIComponent(sessionId)}/payment-order`, undefined, true);
  },

  async getMyBookings() {
    return request<unknown[]>('/marketplace/bookings', undefined, true);
  },

  async getMyBooking(bookingId: string) {
    return request<unknown>(`/marketplace/bookings/${encodeURIComponent(bookingId)}`, undefined, true);
  },

  async getMyMarketplaceProfile() {
    return request<{ userId: string; email: string; role: string; customer: Record<string, unknown> | null }>('/marketplace/me', undefined, true);
  },

  async getTravelProfile(travelId: string) {
    return request<{
      id: string;
      name: string;
      code: string | null;
      slug: string | null;
      address: string | null;
      city: string | null;
      province: string | null;
      phone: string | null;
      email: string | null;
      logo_url: string | null;
      description: string | null;
      verified: boolean;
    }>(`/marketplace/travels/${encodeURIComponent(travelId)}`);
  },
};
