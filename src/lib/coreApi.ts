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

async function request<T>(path: string, init?: RequestInit, authenticated = false, envelope = false): Promise<T> {
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
    return (envelope ? body : body?.data) as T;
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
  async getMarketplaceAgentProfile(slug: string) { return request<{ settings: Record<string, unknown>; travel: Record<string, unknown>; packages: Record<string, unknown>[] }>(`/marketplace/agents/${encodeURIComponent(slug)}`); },
  async getPublicPaymentConfig() { return request<{ provider: 'manual' | 'midtrans' | 'xendit'; isTestMode: boolean; apiKey?: string; autoVerify?: boolean; paymentMethods: Array<Record<string, unknown>>; qrisImageUrl: string }>('/marketplace/payment-config'); },
  async getManagementWebsiteSettings() { return request<Record<string, unknown> | null>('/management/website-settings', undefined, true); },
  async listManagementWebsiteTemplates() { return request<Record<string, unknown>[]>('/management/website-templates', undefined, true); },
  async updateManagementWebsiteSettings(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/management/website-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async listMarketplaceReviews(limit = 50) { return request<Record<string, unknown>[]>(`/marketplace/reviews?limit=${Math.min(100, Math.max(1, limit))}`); },
  async searchMarketplace(params: { q: string; types?: Array<'package' | 'product' | 'doa'>; limit?: number }) { const search = new URLSearchParams({ q: params.q }); if (params.types?.length) search.set('types', params.types.join(',')); if (params.limit) search.set('limit', String(params.limit)); return request<Array<{ id: string; type: 'package' | 'product' | 'doa'; title: string; subtitle?: string; image_url?: string | null; href?: string }>>(`/marketplace/search?${search}`); },
  async getMarketplaceReviewStats() { return request<{ totalReviews: number; averageRating: number; ratingDistribution: { [key: number]: number } }>('/marketplace/reviews/stats'); },
  async listMarketplaceReviewsByTravel(travelId: string) { return request<Record<string, unknown>[]>(`/marketplace/reviews/travel/${encodeURIComponent(travelId)}`); },
  async listCommerceCategories() { return request<Array<Record<string, unknown>>>('/commerce/categories'); },
  async createCommerceCategory(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/commerce/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async updateCommerceCategory(categoryId: string, input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/categories/${encodeURIComponent(categoryId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async listCommerceOrders(params?: { scope?: 'buyer' | 'seller'; page?: number; limit?: number }) { const search = new URLSearchParams(); if (params?.scope) search.set('scope', params.scope); if (params?.page) search.set('page', String(params.page)); if (params?.limit) search.set('limit', String(params.limit)); return request<Array<Record<string, unknown>>>(`/commerce/orders${search.toString() ? `?${search}` : ''}`, undefined, true); },
  async listCommerceOrdersPage(params?: { scope?: 'buyer' | 'seller'; cursor?: string | null; limit?: number }) { const search = new URLSearchParams(); if (params?.scope) search.set('scope', params.scope); if (params?.cursor) search.set('cursor', params.cursor); if (params?.limit) search.set('limit', String(params.limit)); return request<{ data: Array<Record<string, unknown>>; meta: { next_cursor: string | null; has_more: boolean; limit: number } }>(`/commerce/orders?${search}`, undefined, true, true); },
  async getCommerceOrder(orderId: string) { return request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(orderId)}`, undefined, true); },
  async createCommerceOrder(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/commerce/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async updateCommerceOrderStatus(orderId: string, input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(orderId)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadCommercePaymentProof(orderId: string, input: { data: string; contentType: 'image/jpeg' | 'image/png' | 'application/pdf'; filename: string }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(orderId)}/payment-proof`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async getCommerceProduct(productId: string) { return request<Record<string, unknown>>(`/commerce/products/${encodeURIComponent(productId)}`); },
  async listCommerceProducts(params?: { sellerId?: string; categoryId?: string; q?: string; page?: number; limit?: number }) { const search = new URLSearchParams(); if (params?.sellerId) search.set('seller_id', params.sellerId); if (params?.categoryId) search.set('category_id', params.categoryId); if (params?.q) search.set('q', params.q); if (params?.page) search.set('page', String(params.page)); if (params?.limit) search.set('limit', String(params.limit)); return request<Array<Record<string, unknown>>>(`/commerce/products${search.toString() ? `?${search}` : ''}`); },
  async createCommerceProduct(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/commerce/seller/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async updateCommerceProduct(productId: string, input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/seller/products/${encodeURIComponent(productId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadCommerceProductMedia(productId: string, input: { data: string; contentType: 'image/jpeg' | 'image/png' | 'image/webp'; filename: string; media_type?: 'thumbnail' | 'gallery' }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/seller/products/${encodeURIComponent(productId)}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async presignCommerceProductMedia(productId: string, input: { contentType: 'image/jpeg' | 'image/png' | 'image/webp'; filename: string; media_type?: 'thumbnail' | 'gallery' }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, any>>(`/commerce/seller/products/${encodeURIComponent(productId)}/media/presign`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async commitCommerceProductMedia(productId: string, input: { object_key: string; media_type?: 'thumbnail' | 'gallery' }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, any>>(`/commerce/seller/products/${encodeURIComponent(productId)}/media/commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadCommerceProductMediaPresigned(productId: string, file: File, media_type: 'thumbnail' | 'gallery' = 'thumbnail', idempotencyKey = crypto.randomUUID()) { const contentType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'; if (!['image/jpeg','image/png','image/webp'].includes(contentType)) throw new Error('Tipe gambar tidak didukung'); const presigned = await this.presignCommerceProductMedia(productId, { contentType, filename: file.name, media_type }, idempotencyKey); const upload = await fetch(presigned.data.upload_url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file }); if (!upload.ok) throw new Error(`Upload storage gagal (${upload.status})`); return this.commitCommerceProductMedia(productId, { object_key: presigned.data.object_key, media_type }, idempotencyKey); },
  async listCommerceSellerMessages(sellerId: string) { return request<Array<Record<string, unknown>>>(`/commerce/seller/${encodeURIComponent(sellerId)}/messages`, undefined, true); },
  async listCommerceOrderMessages(orderId: string) { return request<Array<Record<string, unknown>>>(`/commerce/orders/${encodeURIComponent(orderId)}/messages`, undefined, true); },
  async presignCommerceChatAttachment(orderId: string, input: { contentType: string; filename: string }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, any>>(`/commerce/orders/${encodeURIComponent(orderId)}/messages/attachments/presign`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadCommerceChatAttachmentPresigned(orderId: string, file: File, idempotencyKey = crypto.randomUUID()) { const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']; if (!allowed.includes(file.type)) throw new Error('Tipe lampiran tidak didukung'); const presigned = await this.presignCommerceChatAttachment(orderId, { contentType: file.type, filename: file.name }, idempotencyKey); const upload = await fetch(presigned.data.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); if (!upload.ok) throw new Error(`Upload storage gagal (${upload.status})`); return { object_key: presigned.data.object_key, attachment_type: file.type.startsWith('image/') ? 'image' : 'file' as const }; },
  async sendCommerceOrderMessage(orderId: string, input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/commerce/orders/${encodeURIComponent(orderId)}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async markCommerceOrderMessagesRead(orderId: string) { return request<{ updated: number }>(`/commerce/orders/${encodeURIComponent(orderId)}/messages/read`, { method: 'PATCH' }, true); },
  async listSubscriptionPlans() { return request<Array<Record<string, unknown>>>('/platform/subscription-plans'); },
  async getMySubscription() { return request<Record<string, unknown> | null>('/platform/me/subscription', undefined, true); },
  async listMyPremiumPaymentEvents(params?: { page?: number; limit?: number }) { const search = new URLSearchParams(); if (params?.page) search.set('page', String(params.page)); if (params?.limit) search.set('limit', String(params.limit)); return request<Array<Record<string, unknown>>>(`/platform/me/premium/payment-events${search.toString() ? `?${search}` : ''}`, undefined, true); },
  async getPremiumSubscriptionPlanStatus() { return request<{ plan: Record<string, unknown> | null; subscription: Record<string, unknown> | null }>('/platform/me/subscription/status', undefined, true); },
  async getBookingReview(bookingId: string) { return request<Record<string, unknown> | null>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/review`, undefined, true); },
  async listBookingDocuments(bookingId: string) { return request<Record<string, unknown>[]>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/documents`, undefined, true); },
  async uploadBookingDocument(bookingId: string, input: { document_type: string; data: string; contentType: 'image/jpeg' | 'image/png' | 'application/pdf'; filename: string }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadPrivateUserDocument(input: { purpose: 'haji_registration' | 'tenant_application'; data: string; contentType: 'image/jpeg' | 'image/png' | 'application/pdf'; filename: string }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/private-documents', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async uploadPublicAsset(input: { data: string; contentType: string; filename: string; bucket?: string }) { return request<{ key: string; url: string; publicUrl: string; storage: 's3' | 'local' }>('/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true); },
  async deletePublicAsset(path: string) { return request<{ success: boolean }>('/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) }, true); },
  async listPrivateUserDocuments(purpose?: 'haji_registration' | 'tenant_application') { return request<Record<string, unknown>[]>(`/private-documents${purpose ? `?purpose=${purpose}` : ''}`, undefined, true); },
  async createBookingReview(bookingId: string, input: { rating: number; content?: string | null }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async updateBookingReview(bookingId: string, input: { rating: number; content?: string | null }) { return request<Record<string, unknown>>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true); },
  async deleteBookingReview(bookingId: string) { return request<void>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/review`, { method: 'DELETE' }, true); },

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

  async listMyPaymentNotifications(params?: { unreadOnly?: boolean; limit?: number; page?: number }) {
    const search = new URLSearchParams(); if (params?.unreadOnly) search.set('unread_only', 'true'); if (params?.limit) search.set('limit', String(params.limit)); if (params?.page) search.set('page', String(params.page));
    return request<{ data: Array<Record<string, unknown>>; meta: Record<string, unknown> }>(`/notifications${search.toString() ? `?${search}` : ''}`, undefined, true);
  },
  async markMyNotificationRead(notificationId: string) { return request<{ ok: boolean }>(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH' }, true); },
  async getManagementMembership(travelId: string) { return request<Record<string, unknown> | null>(`/management/membership/${encodeURIComponent(travelId)}`, undefined, true); },
  async requestManagementMembership(travelId: string, input: { plan_type: string; amount: number; payment_proof_url?: string | null }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/management/membership/${encodeURIComponent(travelId)}/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async approveManagementMembership(membershipId: string, status: 'active' | 'rejected' | 'cancelled', notes?: string) { return request<Record<string, unknown>>(`/management/membership/${encodeURIComponent(membershipId)}/approval`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ status, notes }) }, true); },
  async listFeaturedPackages(position?: string) { return request<Record<string, unknown>[]>(`/management/featured/display${position ? `?position=${encodeURIComponent(position)}` : ''}`); },
  async listAgentFeaturedPackages(travelId: string) { return request<Record<string, unknown>[]>(`/management/featured/${encodeURIComponent(travelId)}`, undefined, true); },
  async listAdminFeaturedPackages(params?: { status?: string; position?: string }) { const search = new URLSearchParams(); if (params?.status) search.set('status', params.status); if (params?.position) search.set('position', params.position); return request<Record<string, unknown>[]>(`/management/featured/admin${search.toString() ? `?${search}` : ''}`, undefined, true); },
  async getAgentCredits(travelId: string) { return request<{ credits_remaining: number }>(`/management/featured/credits/${encodeURIComponent(travelId)}`, undefined, true); },
  async listAgentCreditTransactions(travelId: string) { return request<Record<string, unknown>[]>(`/management/featured/credits/${encodeURIComponent(travelId)}/transactions`, undefined, true); },
  async requestCreditPurchase(travelId: string, input: { credits: number; amount: number; proof_url: string; notes?: string }, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>(`/management/featured/credits/${encodeURIComponent(travelId)}/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async createFeaturedPackage(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) { return request<Record<string, unknown>>('/management/featured', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true); },
  async cancelFeaturedPackage(featuredId: string) { return request<Record<string, unknown>>(`/management/featured/${encodeURIComponent(featuredId)}/cancel`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: '{}' }, true); },
  async listManagementReviews(params?: { q?: string; branchId?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams(); Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
    return request<{ data: Array<Record<string, unknown>>; meta: Record<string, unknown> }>(`/management/reviews${search.toString() ? `?${search}` : ''}`, undefined, true);
  },
  async setManagementReviewPublication(reviewId: string, isPublished: boolean) { return request<Record<string, unknown>>(`/management/reviews/${encodeURIComponent(reviewId)}/publication`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ is_published: isPublished }) }, true); },

  async getMyMarketplaceProfile() {
    return request<{ userId: string; email: string; role: string; customer: Record<string, unknown> | null }>('/marketplace/me', undefined, true);
  },

  async verifyPlatformTravel(id: string, verified: boolean, approval_notes?: string | null) { return request<unknown>(`/platform/admin/travels/${encodeURIComponent(id)}/verification`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ verified, approval_notes }) }, true); },
  async setPlatformTravelStatus(id: string, status: string) { return request<unknown>(`/platform/admin/travels/${encodeURIComponent(id)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ status }) }, true); },
  async createPlatformTravel(input: Record<string, unknown>) { return request<unknown>('/platform/admin/travels', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async updatePlatformTravel(id: string, input: Record<string, unknown>) { return request<unknown>(`/platform/admin/travels/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async deletePlatformTravel(id: string) { return request<void>(`/platform/admin/travels/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Idempotency-Key': crypto.randomUUID() } }, true); },
  async listPlatformAgentWebsiteSettings() { return request<unknown[]>('/platform/admin/agent-website-settings', undefined, true); },
  async updatePlatformAgentWebsiteSettings(userId: string, input: Record<string, unknown>) { return request<unknown>(`/platform/admin/agent-website-settings/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async listPlatformWebsiteTemplates() { return request<Record<string, unknown>[]>('/platform/admin/website-templates', undefined, true); },
  async createPlatformWebsiteTemplate(input: Record<string, unknown>) { return request<Record<string, unknown>>('/platform/admin/website-templates', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async updatePlatformWebsiteTemplate(id: string, input: Record<string, unknown>) { return request<Record<string, unknown>>(`/platform/admin/website-templates/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async deletePlatformWebsiteTemplate(id: string) { return request<void>(`/platform/admin/website-templates/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Idempotency-Key': crypto.randomUUID() } }, true); },
  async listPlatformAdminCredits() { return request<unknown[]>('/platform/admin/credits', undefined, true); },
  async addPlatformAdminCredits(input: { travel_id: string; amount: number; notes?: string }) { return request<unknown>('/platform/admin/credits', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async listPlatformCreditTransactions() { return request<unknown[]>('/platform/admin/credit-transactions', undefined, true); },
  async updatePlatformUserRole(userId: string, role: string) { return request<unknown>(`/platform/admin/users/${encodeURIComponent(userId)}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ role }) }, true); },
  async listPlatformAdminTravels(params?: { q?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams(); Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
    return request<unknown[]>(`/platform/admin/travels${search.toString() ? `?${search}` : ''}`, undefined, true);
  },
  async listPlatformAdminMemberships() { return request<unknown[]>('/platform/admin/memberships', undefined, true); },
  async updatePlatformMembership(id: string, input: Record<string, unknown>) { return request<unknown>(`/platform/admin/memberships/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async listPlatformAdminBanners() { return request<unknown[]>('/platform/admin/banners', undefined, true); },
  async createPlatformAdminBanner(input: Record<string, unknown>) { return request<unknown>('/platform/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async updatePlatformAdminBanner(id: string, input: Record<string, unknown>) { return request<unknown>(`/platform/admin/banners/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input) }, true); },
  async deletePlatformAdminBanner(id: string) { return request<void>(`/platform/admin/banners/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Idempotency-Key': crypto.randomUUID() } }, true); },
  async getPlatformAdminSettings() { return request<unknown[]>('/platform/admin/settings', undefined, true); },
  async updatePlatformAdminSetting(key: string, value: unknown, description?: string) { return request<unknown>(`/platform/admin/settings/${encodeURIComponent(key)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ value, description }) }, true); },
  async getPlatformAdminOverview() {
    return request<{ totalUsers: number; totalAgents: number; totalTravels: number; totalPackages: number; activeMembers: number; pendingMembers: number; totalRevenue: number }>('/platform/admin/overview', undefined, true);
  },
  async listPlatformAdminUsers(params?: { q?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams(); Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
    return request<unknown[]>(`/platform/admin/users${search.toString() ? `?${search}` : ''}`, undefined, true);
  },
  async setPlatformAdminUserSuspension(userId: string, isSuspended: boolean, reason?: string) {
    return request<unknown>(`/platform/admin/users/${encodeURIComponent(userId)}/suspension`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ is_suspended: isSuspended, suspension_reason: reason }) }, true);
  },
  async getManagementReviewAnalytics(params?: { days?: number; branchId?: string }) {
    const search = new URLSearchParams(); if (params?.days) search.set('days', String(params.days)); if (params?.branchId) search.set('branchId', params.branchId);
    return request<{ totalReviews: number; publishedReviews: number; pendingReviews: number; averageRating: number; ratingDistribution: Record<string, number>; reviewsThisMonth: number; reviewsLastMonth: number; topRatedTravels: Array<{ travel_id: string; travel_name: string; average_rating: number; total_reviews: number }>; trend: Array<{ date: string; reviews: number; averageRating: number }> }>(`/management/analytics/reviews${search.toString() ? `?${search}` : ''}`, undefined, true);
  },
  async getManagementBookingAnalytics(params?: { days?: number; branchId?: string }) {
    const search = new URLSearchParams();
    if (params?.days) search.set('days', String(params.days));
    if (params?.branchId) search.set('branchId', params.branchId);
    return request<{ totalBookings: number; pendingBookings: number; confirmedBookings: number; paidBookings: number; cancelledBookings: number; completedBookings: number; totalRevenue: number; paidRevenue: number; remainingRevenue: number; bookingsThisMonth: number; bookingsLastMonth: number; revenueThisMonth: number; revenueLastMonth: number; topTravels: Array<{ travel_id: string; travel_name: string; total_bookings: number; total_revenue: number }>; trend: Array<{ date: string; bookings: number; revenue: number }> }>(`/management/bookings/analytics${search.toString() ? `?${search}` : ''}`, undefined, true);
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

  async getManagementTravel() {
    return request<Record<string, unknown>>('/management/travel', undefined, true);
  },
  async updateManagementTravel(input: Record<string, unknown>) {
    return request<Record<string, unknown>>('/management/travel', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },
  async listManagementPackages(params?: { branchId?: string; q?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(); Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key === 'branchId' ? 'branch_id' : key, String(value)); });
    return request<unknown[]>(`/management/packages${query.toString() ? `?${query.toString()}` : ''}`, undefined, true);
  },
  async createManagementPackage(input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) {
    return request<Record<string, unknown>>('/management/packages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true);
  },
  async updateManagementPackage(id: string, input: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/management/packages/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },
  async archiveManagementPackage(id: string) {
    return request<Record<string, unknown>>(`/management/packages/${encodeURIComponent(id)}/archive`, { method: 'POST' }, true);
  },
  async publishManagementPackage(id: string, idempotencyKey = crypto.randomUUID()) {
    return request<Record<string, unknown>>(`/management/packages/${encodeURIComponent(id)}/publish`, { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } }, true);
  },
  async unpublishManagementPackage(id: string, idempotencyKey = crypto.randomUUID()) {
    return request<Record<string, unknown>>(`/management/packages/${encodeURIComponent(id)}/unpublish`, { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } }, true);
  },
  async listManagementPackageDepartures(packageId: string) {
    return request<unknown[]>(`/management/packages/${encodeURIComponent(packageId)}/departures`, undefined, true);
  },
  async createManagementDeparture(packageId: string, input: Record<string, unknown>, idempotencyKey = crypto.randomUUID()) {
    return request<Record<string, unknown>>(`/management/packages/${encodeURIComponent(packageId)}/departures`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }, true);
  },
  async updateManagementDeparture(id: string, input: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/management/departures/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },
  async archiveManagementDeparture(id: string) {
    return request<Record<string, unknown>>(`/management/departures/${encodeURIComponent(id)}/archive`, { method: 'POST' }, true);
  },

  async listManagementManifestAudit(params?: { departureId?: string; action?: string; actorId?: string; from?: string; to?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.departureId) query.set('departure_id', params.departureId);
    if (params?.action) query.set('action', params.action);
    if (params?.actorId) query.set('actor_id', params.actorId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.offset != null) query.set('offset', String(params.offset));
    return request<{ data: Array<Record<string, unknown>>; meta: { total: number; limit: number; offset: number } }>(`/management/manifest/audit?${query.toString()}`, undefined, true);
  },

  async getMyBookingManifest(bookingId: string) {
    return request<Array<Record<string, unknown>>>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/manifest`, undefined, true);
  },

  async updateMyBookingManifest(bookingId: string, manifestId: string, input: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/marketplace/bookings/${encodeURIComponent(bookingId)}/manifest/${encodeURIComponent(manifestId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },

  async listManagementManifest(departureId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams({ departure_id: departureId, page: String(params?.page || 1), limit: String(params?.limit || 100) });
    return request<unknown[]>(`/management/manifest?${query.toString()}`, undefined, true);
  },

  async createManagementManifest(input: Record<string, unknown>) {
    return request<unknown>('/management/manifest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },

  async updateManagementManifest(id: string, input: Record<string, unknown>) {
    return request<unknown>(`/management/manifest/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, true);
  },

  async deleteManagementManifest(id: string) {
    return request<{ id: string }>(`/management/manifest/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  },

  async bulkUpdateManifestRooming(updates: Array<{ id: string; room_number: string | null; room_type?: string }>) {
    return request<{ count: number }>('/management/manifest/bulk-rooming', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) }, true);
  },

  async bulkUpdateManifestApproval(ids: string[], status: 'pending' | 'approved' | 'rejected', reason?: string | null) {
    return request<{ count: number; status: string }>('/management/manifest/bulk-approval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status, reason: reason ?? null }) }, true);
  },

  async bulkCreateManagementManifest(rows: Array<Record<string, unknown>>) {
    return request<{ count: number; rows: unknown[] }>('/management/manifest/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) }, true);
  },

  async listManagementDeparturesForManifest() {
    return request<Array<{
      id: string;
      departure_date: string;
      return_date: string;
      total_seats: number;
      available_seats: number;
      status: string;
      package_id: string;
      package_name: string;
    }>>('/management/manifest/departures', undefined, true);
  },

  async listManagementDepartureBookings(departureId: string) {
    return request<Array<{
      id: string;
      booking_code?: string;
      contact_name?: string;
      contact_phone?: string;
      number_of_pilgrims?: number;
      total_pax?: number;
      status?: string;
      booking_status?: string;
      travel_id?: string;
    }>>(`/management/bookings?departureId=${encodeURIComponent(departureId)}&limit=100`, undefined, true);
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
