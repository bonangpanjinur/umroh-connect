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
    const contextHeaders: Record<string, string> = {};
    try {
      const tenantId = localStorage.getItem('arahumroh_active_tenant_id') || localStorage.getItem('core_tenant_id') || localStorage.getItem('tenant_id');
      const branchId = localStorage.getItem('arahumroh_active_branch_id') || localStorage.getItem('core_branch_id') || localStorage.getItem('branch_id');
      if (tenantId) contextHeaders['X-Tenant-Id'] = tenantId;
      if (branchId) contextHeaders['X-Branch-Id'] = branchId;
    } catch { /* private browsing/SSR: Core resolves context from JWT */ }
    const response = await fetch(`${CORE_API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Request-Id': requestId,
        ...contextHeaders,
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

interface PaymentScheduleDto {
  id: string;
  booking_id: string;
  sequence_no: number;
  payment_type: 'dp' | 'installment' | 'final';
  title: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  is_paid?: boolean;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paid_at: string | null;
  proof_document_id?: string | null;
  payment_proof_url?: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
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
  } as unknown as Travel;

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

  async listManagementBookings(params?: { status?: string; q?: string; branchId?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value));
    });
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request<unknown[]>(`/management/bookings${suffix}`, undefined, true);
  },

  async createManagementBooking(input: { departureId: string; customerId: string; branchId?: string; pax: number; totalPrice?: number; roomType?: string; notes?: string | null }, idempotencyKey: string) {
    return request<unknown>('/management/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }, true);
  },

  async updateManagementBookingStatus(bookingId: string, status: string) {
    return request<{ id: string; status: string }>(`/management/bookings/${encodeURIComponent(bookingId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, true);
  },

  async restoreManagementPackageDepartures(packageId: string, reason?: string) {
    return request<{
      package_id: string;
      restored_count: number;
      departures: Array<{
        id: string;
        package_id: string;
        branch_id: string | null;
        departure_date: string;
        status: string;
        quota: number | null;
        available_seats: number;
      }>;
    }>(`/management/packages/${encodeURIComponent(packageId)}/departures/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason ? { reason } : {}),
    }, true);
  },

  async allocatePayment(bookingId: string, input: { amount: number; paymentMethod?: string; paymentDate?: string; paymentScheduleId?: string; proofDocumentId?: string; notes?: string | null }, idempotencyKey: string) {
    return request<{ payment: unknown; booking: unknown }>(`/management/bookings/${encodeURIComponent(bookingId)}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }, true);
  },

  async listManagementPaymentSchedules(bookingId: string) {
    return request<PaymentScheduleDto[]>(`/management/bookings/${encodeURIComponent(bookingId)}/payment-schedules`, undefined, true);
  },

  async replaceManagementPaymentSchedules(bookingId: string, schedules: Array<{ paymentType: 'dp' | 'installment' | 'final'; title?: string; amount: number; dueDate: string; notes?: string | null }>) {
    return request<PaymentScheduleDto[]>(`/management/bookings/${encodeURIComponent(bookingId)}/payment-schedules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules }),
    }, true);
  },

  async listMyPaymentSchedules(bookingId: string) {
    return request<PaymentScheduleDto[]>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/payment-schedules`, undefined, true);
  },

  async uploadPaymentProof(bookingId: string, input: { data: string; contentType: string; filename?: string; amount?: number; notes?: string | null }) {
    return request<{ id: string; booking_id: string; status: string; content_type: string; size_bytes: number }>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/payment-proofs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }, true);
  },

  async getPaymentProofUrl(bookingId: string, proofId: string, management = false) {
    const base = management ? '/management' : '/marketplace';
    return `${CORE_API_URL}${base}/bookings/${encodeURIComponent(bookingId)}/payment-proofs/${encodeURIComponent(proofId)}`;
  },

  async recordMarketplaceAnalyticsEvent(input: {
    event_id?: string;
    package_id: string;
    departure_id?: string;
    session_id?: string;
    event_type: 'view' | 'whatsapp_click' | 'inquiry';
    metadata?: Record<string, string>;
  }) {
    return request<{
      event_id: string;
      tenant_id: string;
      branch_id: string | null;
      package_id: string;
      departure_id: string | null;
      event_type: 'view' | 'whatsapp_click' | 'inquiry';
      created_at: string;
    }>('/marketplace/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, event_id: input.event_id || crypto.randomUUID() }),
    });
  },

  async getManagementMarketplaceAnalytics(params?: {
    from?: string;
    to?: string;
    days?: number;
    branchId?: string;
    packageId?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.days) query.set('days', String(params.days));
    if (params?.branchId) query.set('branch_id', params.branchId);
    if (params?.packageId) query.set('package_id', params.packageId);
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{
      package_stats: Array<{ package_id: string; package_name: string; total_views: number; whatsapp_clicks: number; inquiries: number; unique_visitors: number; last_event_at: string | null }>;
      trend: Array<{ date: string; views: number; clicks: number; inquiries: number }>;
      recent: Array<{ event_id: string; package_id: string; package_name: string; departure_id: string | null; event_type: string; created_at: string }>;
      filters: { from: string; to: string; branch_id: string | null; package_id: string | null };
    }>(`/management/analytics/package-interests${query.toString() ? `?${query.toString()}` : ''}`, undefined, true);
  },

  async createTenantApplication(input: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    license_number?: string;
    requested_plan?: 'basic' | 'premium' | 'enterprise';
    notes?: string;
    documents?: string[];
  }, idempotencyKey: string) {
    return request<{
      id: string;
      company_name: string;
      contact_name: string;
      email: string;
      phone: string;
      address: string;
      license_number: string | null;
      requested_plan: string;
      notes: string | null;
      documents: string[];
      status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
      created_at: string;
      updated_at: string;
    }>('/platform/tenant-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }, true);
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
