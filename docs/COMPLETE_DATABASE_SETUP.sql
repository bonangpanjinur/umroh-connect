-- =====================================================
-- ARAH UMROH - COMPLETE DATABASE SETUP
-- =====================================================
-- Version: 1.0.0
-- Last Updated: 2025-01-29
-- Description: Complete SQL untuk setup database baru
-- 
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy paste seluruh isi file ini
-- 3. Klik "Run" untuk eksekusi
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('jamaah', 'agent', 'admin');

-- Package type enum
CREATE TYPE public.package_type AS ENUM ('umroh', 'haji_reguler', 'haji_plus', 'haji_furoda');

-- Checklist category enum
CREATE TYPE public.checklist_category AS ENUM ('dokumen', 'perlengkapan', 'kesehatan', 'mental');

-- Feedback type enum
CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion', 'content', 'other');

-- =====================================================
-- SECTION 2: CORE TABLES
-- =====================================================

-- User Roles Table (CRITICAL for RLS)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'jamaah',
    UNIQUE (user_id, role)
);

-- User Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'jamaah',
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Travel Agencies Table
CREATE TABLE public.travels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    rating NUMERIC(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    approval_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Packages Table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER DEFAULT 9 NOT NULL,
    hotel_makkah TEXT,
    hotel_madinah TEXT,
    hotel_star INTEGER DEFAULT 4,
    airline TEXT,
    flight_type TEXT DEFAULT 'direct' CHECK (flight_type IN ('direct', 'transit')),
    meal_type TEXT DEFAULT 'fullboard' CHECK (meal_type IN ('fullboard', 'halfboard', 'breakfast')),
    facilities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    package_type package_type DEFAULT 'umroh' NOT NULL,
    -- Haji-specific fields
    haji_year INTEGER,
    haji_season TEXT,
    quota_type TEXT,
    estimated_departure_year INTEGER,
    min_dp BIGINT,
    registration_deadline DATE,
    age_requirement TEXT,
    health_requirements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Departures Table
CREATE TABLE public.departures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    price BIGINT NOT NULL,
    original_price BIGINT,
    available_seats INTEGER DEFAULT 45 NOT NULL,
    total_seats INTEGER DEFAULT 45 NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'limited', 'full', 'waitlist', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 3: BOOKING & PAYMENT TABLES
-- =====================================================

-- Bookings Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    departure_id UUID REFERENCES public.departures(id),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    booking_code TEXT NOT NULL UNIQUE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    number_of_pilgrims INTEGER DEFAULT 1 NOT NULL,
    total_price BIGINT NOT NULL,
    paid_amount BIGINT DEFAULT 0 NOT NULL,
    remaining_amount BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    agent_notes TEXT,
    -- Departure reminder flags
    departure_reminder_h30 BOOLEAN DEFAULT false,
    departure_reminder_h14 BOOLEAN DEFAULT false,
    departure_reminder_h7 BOOLEAN DEFAULT false,
    departure_reminder_h3 BOOLEAN DEFAULT false,
    departure_reminder_h1 BOOLEAN DEFAULT false,
    departure_reminder_h0 BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Payment Schedules Table
CREATE TABLE public.payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('dp', 'installment', 'full', 'final')),
    amount BIGINT NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_amount BIGINT,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_proof_url TEXT,
    notes TEXT,
    -- Reminder flags
    reminder_sent_h7 BOOLEAN DEFAULT false,
    reminder_sent_h3 BOOLEAN DEFAULT false,
    reminder_sent_h1 BOOLEAN DEFAULT false,
    reminder_sent_overdue BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 4: COMMUNICATION TABLES
-- =====================================================

-- Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('jamaah', 'agent')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Package Inquiries Table
CREATE TABLE public.package_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    departure_id UUID REFERENCES public.departures(id),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT,
    number_of_people INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'closed')),
    contacted_at TIMESTAMP WITH TIME ZONE,
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Agent Notifications Table
CREATE TABLE public.agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 5: CONTENT MANAGEMENT TABLES
-- =====================================================

-- Manasik Guides Table
CREATE TABLE public.manasik_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_arabic TEXT,
    category TEXT DEFAULT 'umroh' NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    image_url TEXT,
    audio_url TEXT,
    video_url TEXT,
    doa_arabic TEXT,
    doa_latin TEXT,
    doa_meaning TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Important Locations Table
CREATE TABLE public.important_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    category TEXT DEFAULT 'masjid' NOT NULL CHECK (category IN ('masjid', 'miqat', 'ziarah', 'landmark', 'hotel', 'hospital', 'embassy', 'shopping')),
    city TEXT DEFAULT 'Makkah' NOT NULL CHECK (city IN ('Makkah', 'Madinah')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    image_url TEXT,
    opening_hours TEXT,
    priority INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Prayers (Doa) Categories Table
CREATE TABLE public.prayer_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    icon TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Prayers (Doa) Table
CREATE TABLE public.prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.prayer_categories(id),
    title TEXT NOT NULL,
    title_arabic TEXT,
    arabic_text TEXT NOT NULL,
    transliteration TEXT,
    translation TEXT,
    benefits TEXT,
    source TEXT,
    audio_url TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Packing Templates Table
CREATE TABLE public.packing_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'pakaian' NOT NULL,
    gender TEXT DEFAULT 'both' CHECK (gender IN ('male', 'female', 'both')),
    is_essential BOOLEAN DEFAULT false,
    quantity_suggestion INTEGER DEFAULT 1,
    weather_related BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 6: USER FEATURE TABLES
-- =====================================================

-- Checklists Table
CREATE TABLE public.checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category checklist_category NOT NULL,
    phase TEXT DEFAULT 'H-30' NOT NULL,
    priority INTEGER DEFAULT 0 NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User Checklists Progress Table
CREATE TABLE public.user_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, checklist_id)
);

-- Journals Table
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    mood TEXT,
    location_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Journal Photos Table
CREATE TABLE public.journal_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID REFERENCES public.journals(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 7: HAJI MANAGEMENT TABLES
-- =====================================================

-- Haji Checklists Table
CREATE TABLE public.haji_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'dokumen' NOT NULL,
    is_required BOOLEAN DEFAULT true,
    applies_to TEXT[] DEFAULT ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'],
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Haji Registrations Table
CREATE TABLE public.haji_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    nik TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    birth_date DATE NOT NULL,
    address TEXT,
    porsi_number TEXT,
    registration_year INTEGER,
    estimated_departure_year INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'waiting', 'departed', 'cancelled')),
    documents JSONB DEFAULT '{}',
    dp_amount BIGINT DEFAULT 0,
    dp_paid_at TIMESTAMP WITH TIME ZONE,
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 8: TRACKING & GEOFENCING TABLES
-- =====================================================

-- Tracking Groups Table
CREATE TABLE public.tracking_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    travel_id UUID REFERENCES public.travels(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Group Locations Table
CREATE TABLE public.group_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.tracking_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    battery_level INTEGER,
    is_sharing BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Geofences Table
CREATE TABLE public.geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    zone_type TEXT DEFAULT 'hotel' CHECK (zone_type IN ('hotel', 'masjid', 'miqat', 'custom')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER DEFAULT 500 NOT NULL,
    group_id UUID REFERENCES public.tracking_groups(id),
    travel_id UUID REFERENCES public.travels(id),
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Geofence Alerts Table
CREATE TABLE public.geofence_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    alert_type TEXT DEFAULT 'exit' CHECK (alert_type IN ('exit', 'enter')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    distance_from_center DOUBLE PRECISION,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 9: MONETIZATION TABLES
-- =====================================================

-- Memberships Table
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    amount BIGINT DEFAULT 0 NOT NULL,
    payment_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Package Credits Table
CREATE TABLE public.package_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL UNIQUE,
    credits_remaining INTEGER DEFAULT 0 NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Credit Transactions Table
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund')),
    amount INTEGER NOT NULL,
    price BIGINT,
    package_id UUID REFERENCES public.packages(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Featured Packages Table
CREATE TABLE public.featured_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    position TEXT DEFAULT 'home' CHECK (position IN ('home', 'search', 'category')),
    priority INTEGER DEFAULT 0 NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Banners Table
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT DEFAULT 'home' CHECK (position IN ('home', 'paket', 'detail')),
    priority INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    travel_id UUID REFERENCES public.travels(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Platform Settings Table
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 10: REVIEW & FEEDBACK TABLES
-- =====================================================

-- Travel Reviews Table
CREATE TABLE public.travel_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_published BOOLEAN DEFAULT true,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Content Ratings Table
CREATE TABLE public.content_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, content_type, content_id)
);

-- Feedbacks Table
CREATE TABLE public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    feedback_type feedback_type DEFAULT 'other' NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    rating INTEGER,
    screenshot_url TEXT,
    device_info JSONB,
    app_version TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 11: NOTIFICATION LOGS TABLES
-- =====================================================

-- Departure Notification Logs Table
CREATE TABLE public.departure_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Notification Logs Table
CREATE TABLE public.payment_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    payment_schedule_id UUID REFERENCES public.payment_schedules(id),
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Push Subscriptions Table
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- =====================================================
-- SECTION 12: ANALYTICS TABLES
-- =====================================================

-- Package Interests Table
CREATE TABLE public.package_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    departure_id UUID REFERENCES public.departures(id),
    user_id UUID,
    session_id TEXT,
    interest_type TEXT DEFAULT 'view' CHECK (interest_type IN ('view', 'whatsapp', 'inquiry', 'booking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Agent Applications Table
CREATE TABLE public.agent_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    travel_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    documents TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Master Data: Hotels Table
CREATE TABLE public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT DEFAULT 'Makkah' CHECK (city IN ('Makkah', 'Madinah')),
    star_rating INTEGER DEFAULT 4 NOT NULL,
    distance_to_haram TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Master Data: Airlines Table
CREATE TABLE public.airlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- SECTION 13: HELPER FUNCTIONS
-- =====================================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user owns a travel agency
CREATE OR REPLACE FUNCTION public.owns_travel(_user_id UUID, _travel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travels t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE t.id = _travel_id AND p.user_id = _user_id
  )
$$;

-- Check if user owns a package
CREATE OR REPLACE FUNCTION public.owns_package(_user_id UUID, _package_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.packages pkg
    JOIN public.travels t ON pkg.travel_id = t.id
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE pkg.id = _package_id AND p.user_id = _user_id
  )
$$;

-- Check if user owns a departure
CREATE OR REPLACE FUNCTION public.owns_departure(_user_id UUID, _departure_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.departures d
    JOIN public.packages pkg ON d.package_id = pkg.id
    JOIN public.travels t ON pkg.travel_id = t.id
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE d.id = _departure_id AND p.user_id = _user_id
  )
$$;

-- Get profile ID from user ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'jamaah');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'jamaah');
  
  RETURN NEW;
END;
$$;

-- Update travel rating from reviews
CREATE OR REPLACE FUNCTION public.update_travel_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.travel_reviews
  WHERE travel_id = COALESCE(NEW.travel_id, OLD.travel_id)
    AND is_published = true;
  
  UPDATE public.travels
  SET 
    rating = ROUND(avg_rating, 1),
    review_count = review_count
  WHERE id = COALESCE(NEW.travel_id, OLD.travel_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Generate booking code
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'AU-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Set booking code trigger function
CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Update booking paid amount
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(paid_amount), 0) 
      FROM public.payment_schedules 
      WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Generate group code
CREATE OR REPLACE FUNCTION public.generate_group_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS (SELECT 1 FROM public.tracking_groups WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Set group code trigger function
CREATE OR REPLACE FUNCTION public.set_group_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_group_code();
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- SECTION 14: TRIGGERS
-- =====================================================

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travels_updated_at BEFORE UPDATE ON public.travels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departures_updated_at BEFORE UPDATE ON public.departures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Booking code trigger
CREATE TRIGGER set_booking_code_trigger BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION set_booking_code();

-- Payment update trigger
CREATE TRIGGER update_booking_paid_amount_trigger AFTER INSERT OR UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION update_booking_paid_amount();

-- Review rating trigger
CREATE TRIGGER update_travel_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON public.travel_reviews FOR EACH ROW EXECUTE FUNCTION update_travel_rating();

-- Group code trigger
CREATE TRIGGER set_group_code_trigger BEFORE INSERT ON public.tracking_groups FOR EACH ROW EXECUTE FUNCTION set_group_code();

-- =====================================================
-- SECTION 15: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manasik_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haji_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haji_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 16: RLS POLICIES
-- =====================================================

-- User Roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Travels policies
CREATE POLICY "Anyone can view active verified travels" ON public.travels FOR SELECT USING (status = 'active' AND verified = true OR owns_travel(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can update own travel" ON public.travels FOR UPDATE USING (owns_travel(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all travels" ON public.travels FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Packages policies
CREATE POLICY "Anyone can view active packages" ON public.packages FOR SELECT USING (is_active = true AND EXISTS (SELECT 1 FROM travels t WHERE t.id = travel_id AND t.status = 'active' AND t.verified = true) OR owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can create packages" ON public.packages FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update packages" ON public.packages FOR UPDATE USING (owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete packages" ON public.packages FOR DELETE USING (owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'));

-- Departures policies
CREATE POLICY "Anyone can view departures" ON public.departures FOR SELECT USING (EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND p.is_active = true) OR owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can create departures" ON public.departures FOR INSERT WITH CHECK (owns_package(auth.uid(), package_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update departures" ON public.departures FOR UPDATE USING (owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete departures" ON public.departures FOR DELETE USING (owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'));

-- Bookings policies
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can update bookings" ON public.bookings FOR UPDATE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can delete bookings" ON public.bookings FOR DELETE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

-- Payment schedules policies
CREATE POLICY "Users can view own payments" ON public.payment_schedules FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR owns_travel(auth.uid(), b.travel_id))) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can manage payments" ON public.payment_schedules FOR ALL USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND owns_travel(auth.uid(), b.travel_id)) OR has_role(auth.uid(), 'admin'));

-- Chat messages policies
CREATE POLICY "Users can view their own chats" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR owns_travel(auth.uid(), travel_id)));
CREATE POLICY "Users can mark messages as read" ON public.chat_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR owns_travel(auth.uid(), travel_id));

-- Package inquiries policies
CREATE POLICY "Users can view own inquiries" ON public.package_inquiries FOR SELECT USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create inquiries" ON public.package_inquiries FOR INSERT WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())));
CREATE POLICY "Agents can update inquiries" ON public.package_inquiries FOR UPDATE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can delete inquiries" ON public.package_inquiries FOR DELETE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

-- Agent notifications policies
CREATE POLICY "Agents can view own notifications" ON public.agent_notifications FOR SELECT USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can update own notifications" ON public.agent_notifications FOR UPDATE USING (owns_travel(auth.uid(), travel_id));
CREATE POLICY "System can create notifications" ON public.agent_notifications FOR INSERT WITH CHECK (true);

-- Public content policies
CREATE POLICY "Anyone can view active manasik" ON public.manasik_guides FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage manasik" ON public.manasik_guides FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active locations" ON public.important_locations FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage locations" ON public.important_locations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active prayer categories" ON public.prayer_categories FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage prayer categories" ON public.prayer_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active prayers" ON public.prayers FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage prayers" ON public.prayers FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active packing templates" ON public.packing_templates FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage packing templates" ON public.packing_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active checklists" ON public.checklists FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage checklists" ON public.checklists FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User checklists policies
CREATE POLICY "Users can manage own checklists" ON public.user_checklists FOR ALL USING (auth.uid() = user_id);

-- Journals policies
CREATE POLICY "Users can view own journals" ON public.journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public journals" ON public.journals FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own journals" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals" ON public.journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals" ON public.journals FOR DELETE USING (auth.uid() = user_id);

-- Journal photos policies
CREATE POLICY "Users can view photos of accessible journals" ON public.journal_photos FOR SELECT USING (EXISTS (SELECT 1 FROM journals j WHERE j.id = journal_id AND (j.user_id = auth.uid() OR j.is_public = true)));
CREATE POLICY "Users can add photos to own journals" ON public.journal_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM journals j WHERE j.id = journal_id AND j.user_id = auth.uid()));
CREATE POLICY "Users can delete photos from own journals" ON public.journal_photos FOR DELETE USING (EXISTS (SELECT 1 FROM journals j WHERE j.id = journal_id AND j.user_id = auth.uid()));

-- Haji policies
CREATE POLICY "Anyone can view haji checklists" ON public.haji_checklists FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage haji checklists" ON public.haji_checklists FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own haji registrations" ON public.haji_registrations FOR SELECT USING (auth.uid() = user_id OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create haji registrations" ON public.haji_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents can update haji registrations" ON public.haji_registrations FOR UPDATE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can delete haji registrations" ON public.haji_registrations FOR DELETE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

-- Tracking policies
CREATE POLICY "Users can view own groups" ON public.tracking_groups FOR SELECT USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM group_locations gl WHERE gl.group_id = id AND gl.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create groups" ON public.tracking_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update groups" ON public.tracking_groups FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete groups" ON public.tracking_groups FOR DELETE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Group members can view all locations in their group" ON public.group_locations FOR SELECT USING (EXISTS (SELECT 1 FROM group_locations gl WHERE gl.group_id = group_id AND gl.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM tracking_groups tg WHERE tg.id = group_id AND tg.created_by = auth.uid()));
CREATE POLICY "Users can insert their own location" ON public.group_locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own location" ON public.group_locations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own location" ON public.group_locations FOR DELETE USING (user_id = auth.uid());

-- Geofence policies
CREATE POLICY "Users can view geofences for their groups" ON public.geofences FOR SELECT USING (group_id IN (SELECT group_id FROM group_locations WHERE user_id = auth.uid()) OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Group creators and agents can create geofences" ON public.geofences FOR INSERT WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can update their geofences" ON public.geofences FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators can delete their geofences" ON public.geofences FOR DELETE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view alerts for their groups" ON public.geofence_alerts FOR SELECT USING (user_id = auth.uid() OR geofence_id IN (SELECT id FROM geofences WHERE created_by = auth.uid()) OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create alerts" ON public.geofence_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Agents can acknowledge alerts" ON public.geofence_alerts FOR UPDATE USING (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin') OR geofence_id IN (SELECT id FROM geofences WHERE created_by = auth.uid()));

-- Monetization policies
CREATE POLICY "Agents can view own membership" ON public.memberships FOR SELECT USING (owns_travel(auth.uid(), travel_id));
CREATE POLICY "Agents can request membership" ON public.memberships FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id) AND status = 'pending');
CREATE POLICY "Admins can manage all memberships" ON public.memberships FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own credits" ON public.package_credits FOR SELECT USING (owns_travel(auth.uid(), travel_id));
CREATE POLICY "Admins can manage all credits" ON public.package_credits FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own transactions" ON public.credit_transactions FOR SELECT USING (owns_travel(auth.uid(), travel_id));
CREATE POLICY "Agents can create usage transactions" ON public.credit_transactions FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id) AND transaction_type = 'usage');
CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active featured packages" ON public.featured_packages FOR SELECT USING (status = 'active' AND end_date >= now());
CREATE POLICY "Agents can view own featured packages" ON public.featured_packages FOR SELECT USING (owns_travel(auth.uid(), travel_id));
CREATE POLICY "Agents can create featured packages" ON public.featured_packages FOR INSERT WITH CHECK (owns_travel(auth.uid(), travel_id));
CREATE POLICY "Admins can manage all featured packages" ON public.featured_packages FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "Admins can manage all banners" ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Review policies
CREATE POLICY "Anyone can view published reviews" ON public.travel_reviews FOR SELECT USING (is_published = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create reviews" ON public.travel_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.travel_reviews FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all reviews" ON public.travel_reviews FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view ratings" ON public.content_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create own ratings" ON public.content_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.content_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all ratings" ON public.content_ratings FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own feedback" ON public.feedbacks FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create feedback" ON public.feedbacks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage all feedback" ON public.feedbacks FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Notification policies
CREATE POLICY "Users can read own departure notifications" ON public.departure_notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own departure notifications" ON public.departure_notification_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification logs" ON public.payment_notification_logs FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users and agents can create notification logs" ON public.payment_notification_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'))));
CREATE POLICY "Users can update own notification logs" ON public.payment_notification_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Anyone can create valid interests" ON public.package_interests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND p.is_active = true));
CREATE POLICY "Agents can view own package interests" ON public.package_interests FOR SELECT USING (EXISTS (SELECT 1 FROM packages pkg JOIN travels t ON pkg.travel_id = t.id JOIN profiles p ON t.owner_id = p.id WHERE pkg.id = package_id AND p.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own applications" ON public.agent_applications FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create applications" ON public.agent_applications FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage all applications" ON public.agent_applications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Master data policies
CREATE POLICY "Anyone can view active hotels" ON public.hotels FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage hotels" ON public.hotels FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active airlines" ON public.airlines FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage airlines" ON public.airlines FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECTION 17: STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-logos', 'travel-logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('package-images', 'package-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('prayer-audio', 'prayer-audio', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('haji-documents', 'haji-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read travel-logos" ON storage.objects FOR SELECT USING (bucket_id = 'travel-logos');
CREATE POLICY "Agents can upload travel-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'travel-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read package-images" ON storage.objects FOR SELECT USING (bucket_id = 'package-images');
CREATE POLICY "Agents can upload package-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'package-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own journal-photos" ON storage.objects FOR SELECT USING (bucket_id = 'journal-photos');
CREATE POLICY "Users can upload journal-photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'journal-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read prayer-audio" ON storage.objects FOR SELECT USING (bucket_id = 'prayer-audio');
CREATE POLICY "Admins can upload prayer-audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prayer-audio' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own haji-documents" ON storage.objects FOR SELECT USING (bucket_id = 'haji-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload haji-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'haji-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Users can upload to uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

-- =====================================================
-- SECTION 18: REALTIME
-- =====================================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;

-- =====================================================
-- =====================================================
-- SECTION 19: SEED DATA (Data Awal)
-- =====================================================
-- =====================================================

-- ========================================
-- 1. MANASIK GUIDES (Panduan Umroh)
-- ========================================
INSERT INTO manasik_guides (title, title_arabic, category, order_index, description, content, doa_arabic, doa_latin, doa_meaning, is_active) VALUES
('Niat & Ihram', 'نية الإحرام', 'umroh', 1, 
'Ihram adalah niat untuk memulai ibadah umroh dengan mengenakan pakaian ihram. Dilakukan di Miqat sebelum memasuki tanah suci.',
'1. Mandi sunnah ihram (untuk laki-laki dan perempuan)
2. Laki-laki memakai 2 lembar kain putih tanpa jahitan
3. Perempuan memakai pakaian yang menutup aurat, tidak bercadar
4. Shalat sunnah ihram 2 rakaat
5. Berniat ihram menghadap kiblat
6. Mengucapkan Talbiyah

Tips:
- Gunakan sabun tanpa pewangi sebelum ihram
- Pastikan kain ihram bersih dan tidak tipis
- Siapkan safety pin untuk mengamankan kain',
'لَبَّيْكَ اللَّهُمَّ عُمْرَةً',
'Labbaikallahumma ''umratan',
'Aku memenuhi panggilan-Mu ya Allah untuk umroh',
true),

('Talbiyah', 'التَّلْبِيَة', 'umroh', 2,
'Talbiyah adalah ucapan yang dibaca terus-menerus sejak berniat ihram hingga memulai tawaf. Menunjukkan ketaatan penuh kepada Allah.',
'1. Baca talbiyah dengan suara keras (untuk laki-laki)
2. Baca talbiyah dengan suara pelan (untuk perempuan)
3. Terus-menerus dibaca selama perjalanan
4. Dihentikan saat memulai tawaf

Tips:
- Hafalkan bacaan talbiyah sebelum berangkat
- Bacalah dengan penuh penghayatan dan kekhusyukan',
'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
'Aku memenuhi panggilan-Mu ya Allah, aku memenuhi panggilan-Mu. Aku memenuhi panggilan-Mu, tidak ada sekutu bagi-Mu, aku memenuhi panggilan-Mu. Sesungguhnya segala puji, nikmat, dan kerajaan adalah milik-Mu, tidak ada sekutu bagi-Mu.',
true),

('Tawaf', 'الطَّوَاف', 'umroh', 3,
'Tawaf adalah mengelilingi Ka''bah sebanyak 7 kali putaran berlawanan arah jarum jam. Dimulai dan diakhiri di garis Hajar Aswad.',
'1. Masuk Masjidil Haram dengan kaki kanan sambil berdoa
2. Menghadap Hajar Aswad, angkat tangan kanan dan ucapkan "Bismillahi Allahu Akbar"
3. Laki-laki melakukan Idhtiba'' (membuka bahu kanan) saat tawaf qudum
4. Mulai tawaf dari garis Hajar Aswad berlawanan jarum jam
5. Laki-laki melakukan Raml (jalan cepat) pada 3 putaran pertama
6. Berdoa bebas atau zikir selama tawaf
7. Di Rukun Yamani, usap dengan tangan kanan jika memungkinkan
8. Selesaikan 7 putaran penuh

Tips:
- Hindari mendorong jamaah lain saat menuju Hajar Aswad
- Jaga wudhu selama tawaf
- Boleh istirahat jika lelah, tapi jangan duduk di area tawaf',
'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
'Bismillahi wallahu akbar',
'Dengan nama Allah, dan Allah Maha Besar',
true),

('Shalat Sunnah Tawaf', 'صلاة سنة الطواف', 'umroh', 4,
'Setelah menyelesaikan 7 putaran tawaf, disunnahkan melaksanakan shalat 2 rakaat di belakang Maqam Ibrahim atau di tempat lain dalam Masjidil Haram.',
'1. Menuju Maqam Ibrahim setelah tawaf
2. Baca doa mendekati Maqam Ibrahim
3. Shalat 2 rakaat (rakaat 1 baca Al-Kafirun, rakaat 2 baca Al-Ikhlas)
4. Jika penuh, boleh shalat di tempat lain dalam masjid
5. Minum air zamzam dan berdoa

Tips:
- Tidak wajib tepat di belakang Maqam Ibrahim
- Berdoa dengan khusyuk setelah shalat
- Minum air zamzam sebanyak-banyaknya',
'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
'Wattakhidzu min maqami Ibrahima mushalla',
'Dan jadikanlah sebagian maqam Ibrahim sebagai tempat shalat',
true),

('Sa''i', 'السَّعْي', 'umroh', 5,
'Sa''i adalah berjalan dari bukit Safa ke Marwah sebanyak 7 kali perjalanan. Mengenang perjuangan Siti Hajar mencari air untuk Nabi Ismail.',
'1. Menuju bukit Safa setelah shalat tawaf
2. Naik ke bukit Safa, menghadap Ka''bah, angkat tangan dan berdoa
3. Berjalan menuju Marwah (hitungan 1)
4. Laki-laki berlari kecil di area lampu hijau
5. Naik ke Marwah, menghadap Ka''bah, berdoa
6. Kembali ke Safa (hitungan 2)
7. Ulangi hingga 7 kali, berakhir di Marwah
8. Berdoa bebas selama perjalanan

Tips:
- Boleh menggunakan kursi roda jika tidak mampu berjalan
- Tidak disyaratkan dalam keadaan suci dari hadats
- Perbanyak doa untuk diri sendiri dan keluarga',
'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
'Innas shafa wal marwata min sya''airillah',
'Sesungguhnya Safa dan Marwah adalah sebagian dari syi''ar Allah',
true),

('Tahallul', 'التَّحَلُّل', 'umroh', 6,
'Tahallul adalah mencukur atau memotong rambut sebagai tanda selesainya ibadah umroh. Setelah tahallul, jamaah terbebas dari larangan ihram.',
'1. Setelah selesai sa''i di Marwah
2. Laki-laki: mencukur habis (lebih utama) atau memotong minimal 3 helai
3. Perempuan: memotong ujung rambut sepanjang satu ruas jari
4. Setelah tahallul, semua larangan ihram gugur
5. Boleh kembali memakai pakaian biasa

Tips:
- Tersedia jasa cukur di sekitar Marwah
- Siapkan gunting kecil jika ingin memotong sendiri
- Perempuan tidak boleh mencukur habis, cukup memotong ujung',
'اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ',
'Allahummaghfir lil muhalliqina wal muqashshirina',
'Ya Allah, ampunilah orang-orang yang mencukur dan yang memotong rambutnya',
true);


-- ========================================
-- 2. IMPORTANT LOCATIONS (Lokasi Penting)
-- ========================================
INSERT INTO important_locations (name, name_arabic, category, city, latitude, longitude, description, address, is_active, priority) VALUES
-- Makkah
('Masjidil Haram', 'المسجد الحرام', 'masjid', 'Makkah', 21.4225, 39.8262, 'Masjid suci tempat Ka''bah berada. Pusat ibadah umroh dan haji.', 'Makkah, Arab Saudi', true, 1),
('Ka''bah', 'الكعبة', 'landmark', 'Makkah', 21.4225, 39.8262, 'Rumah Allah yang menjadi kiblat umat Islam sedunia.', 'Di dalam Masjidil Haram', true, 2),
('Safa & Marwah', 'الصفا والمروة', 'landmark', 'Makkah', 21.4234, 39.8269, 'Dua bukit tempat Sa''i dilakukan, sekarang berada dalam Masjidil Haram.', 'Di dalam Masjidil Haram', true, 3),
('Maqam Ibrahim', 'مقام إبراهيم', 'landmark', 'Makkah', 21.4225, 39.8264, 'Batu tempat Nabi Ibrahim berdiri saat membangun Ka''bah.', 'Di dalam Masjidil Haram', true, 4),
('Hajar Aswad', 'الحجر الأسود', 'landmark', 'Makkah', 21.4224, 39.8263, 'Batu hitam dari surga, titik awal dan akhir tawaf.', 'Di sudut Ka''bah', true, 5),
('Sumur Zamzam', 'بئر زمزم', 'landmark', 'Makkah', 21.4226, 39.8265, 'Sumber air suci yang muncul untuk Hajar dan Ismail.', 'Basement Masjidil Haram', true, 6),

-- Miqat
('Miqat Yalamlam', 'يلملم', 'miqat', 'Makkah', 20.5519, 39.8503, 'Miqat untuk jamaah dari arah Yemen dan Indonesia (via laut).', 'Selatan Makkah', true, 10),
('Miqat Juhfah (Rabigh)', 'الجحفة', 'miqat', 'Makkah', 22.7208, 39.0917, 'Miqat untuk jamaah dari arah Mesir, Syam, dan Maghribi.', 'Barat Laut Makkah', true, 11),
('Miqat Bir Ali (Dzulhulaifah)', 'ذو الحليفة', 'miqat', 'Madinah', 24.4136, 39.5436, 'Miqat untuk jamaah dari Madinah. Miqat terjauh dari Makkah.', 'Selatan Madinah', true, 12),
('Miqat Qarn al-Manazil', 'قرن المنازل', 'miqat', 'Makkah', 21.6167, 40.4167, 'Miqat untuk jamaah dari arah Najd dan negara-negara Teluk.', 'Timur Makkah', true, 13),

-- Madinah
('Masjid Nabawi', 'المسجد النبوي', 'masjid', 'Madinah', 24.4672, 39.6112, 'Masjid Nabi Muhammad SAW. Sholat di sini bernilai 1000x lipat.', 'Madinah, Arab Saudi', true, 20),
('Raudhah', 'الروضة', 'landmark', 'Madinah', 24.4673, 39.6113, 'Taman surga antara mimbar dan makam Nabi SAW.', 'Di dalam Masjid Nabawi', true, 21),
('Makam Rasulullah', 'قبر الرسول', 'ziarah', 'Madinah', 24.4673, 39.6114, 'Makam Nabi Muhammad SAW, Abu Bakar, dan Umar bin Khattab.', 'Di dalam Masjid Nabawi', true, 22),
('Pemakaman Baqi', 'البقيع', 'ziarah', 'Madinah', 24.4678, 39.6147, 'Pemakaman para sahabat dan keluarga Nabi SAW.', 'Sebelah timur Masjid Nabawi', true, 23),
('Masjid Quba', 'مسجد قباء', 'masjid', 'Madinah', 24.4397, 39.6172, 'Masjid pertama dalam Islam. Sholat di sini = pahala umroh.', 'Selatan Madinah', true, 24),
('Masjid Qiblatain', 'مسجد القبلتين', 'masjid', 'Madinah', 24.4803, 39.5917, 'Masjid tempat turunnya perintah perubahan kiblat.', 'Barat Laut Madinah', true, 25),
('Jabal Uhud', 'جبل أحد', 'ziarah', 'Madinah', 24.5011, 39.6156, 'Gunung tempat Perang Uhud. Nabi bersabda: "Uhud mencintai kita."', 'Utara Madinah', true, 26),
('Makam Syuhada Uhud', 'شهداء أحد', 'ziarah', 'Madinah', 24.4989, 39.6128, 'Tempat peristirahatan 70 syuhada Uhud termasuk Hamzah.', 'Dekat Jabal Uhud', true, 27);


-- ========================================
-- 3. CHECKLISTS (Checklist Persiapan)
-- ========================================
INSERT INTO checklists (title, description, category, phase, priority, icon, is_active) VALUES
-- H-30: Persiapan Awal
('Cek Masa Berlaku Paspor', 'Pastikan paspor masih berlaku minimal 6 bulan dari tanggal keberangkatan', 'dokumen', 'H-30', 1, 'file-text', true),
('Daftar Vaksinasi Meningitis', 'Lakukan vaksinasi meningitis di klinik kesehatan yang ditunjuk', 'kesehatan', 'H-30', 2, 'syringe', true),
('Siapkan Foto untuk Visa', 'Foto berwarna ukuran 4x6 dengan latar belakang putih', 'dokumen', 'H-30', 3, 'camera', true),
('Mulai Latihan Jalan Kaki', 'Latihan stamina dengan jalan kaki 2-3 km setiap hari', 'kesehatan', 'H-30', 4, 'footprints', true),
('Pelajari Tata Cara Umroh', 'Mulai mempelajari bacaan dan gerakan manasik umroh', 'mental', 'H-30', 5, 'book-open', true),

-- H-7: Persiapan Akhir
('Siapkan Koper dan Perlengkapan', 'Pack pakaian ihram, mukena, sajadah, dan perlengkapan pribadi', 'perlengkapan', 'H-7', 1, 'luggage', true),
('Siapkan Obat-obatan Pribadi', 'Bawa obat rutin, vitamin, dan P3K dasar', 'kesehatan', 'H-7', 2, 'pill', true),
('Fotokopi Dokumen Penting', 'Fotokopi paspor, visa, tiket, dan simpan terpisah dari aslinya', 'dokumen', 'H-7', 3, 'copy', true),
('Konfirmasi Jadwal Keberangkatan', 'Hubungi travel untuk konfirmasi jadwal dan meeting point', 'perlengkapan', 'H-7', 4, 'phone', true),
('Hafalkan Doa-doa Manasik', 'Pastikan sudah hafal doa tawaf, sai, dan doa-doa penting lainnya', 'mental', 'H-7', 5, 'book-heart', true),
('Tukar Mata Uang', 'Tukar rupiah ke Riyal Saudi secukupnya', 'perlengkapan', 'H-7', 6, 'banknote', true),

-- H-1: Hari Terakhir
('Cek Ulang Semua Dokumen', 'Pastikan paspor, visa, tiket, dan dokumen penting ada di tas kabin', 'dokumen', 'H-1', 1, 'clipboard-check', true),
('Sholat Istikharah', 'Lakukan sholat istikharah dan minta restu keluarga', 'mental', 'H-1', 2, 'heart', true),
('Charge Semua Device', 'Pastikan HP, powerbank, dan device lain terisi penuh', 'perlengkapan', 'H-1', 3, 'battery-charging', true),
('Siapkan Pakaian Ihram', 'Taruh pakaian ihram di tempat yang mudah dijangkau', 'perlengkapan', 'H-1', 4, 'shirt', true),
('Berangkat ke Bandara', 'Datang 3 jam sebelum jadwal keberangkatan', 'perlengkapan', 'H-1', 5, 'plane', true);


-- ========================================
-- 4. PACKING TEMPLATES (Template Packing List)
-- ========================================
INSERT INTO packing_templates (name, category, gender, description, is_essential, priority, quantity_suggestion, is_active) VALUES
-- Pakaian
('Kain Ihram (2 lembar)', 'pakaian', 'male', 'Kain putih tanpa jahitan untuk ihram', true, 1, 2, true),
('Mukena', 'pakaian', 'female', 'Mukena untuk sholat', true, 1, 2, true),
('Pakaian Harian', 'pakaian', 'both', 'Pakaian ganti sehari-hari', true, 2, 5, true),
('Pakaian Dalam', 'pakaian', 'both', 'Celana dalam dan kaos dalam', true, 3, 7, true),
('Sandal Jepit', 'pakaian', 'both', 'Sandal untuk berjalan', true, 4, 1, true),
('Sepatu Nyaman', 'pakaian', 'both', 'Sepatu yang nyaman untuk jalan jauh', false, 5, 1, true),
('Kaos Kaki', 'pakaian', 'both', 'Untuk pelindung kaki', false, 6, 5, true),
('Jaket Tipis', 'pakaian', 'both', 'Untuk ruangan ber-AC', false, 7, 1, true),

-- Dokumen
('Paspor', 'dokumen', 'both', 'Paspor asli dengan masa berlaku min. 6 bulan', true, 1, 1, true),
('Visa Umroh', 'dokumen', 'both', 'Visa yang sudah disetujui', true, 2, 1, true),
('Tiket Pesawat', 'dokumen', 'both', 'E-ticket atau tiket fisik', true, 3, 1, true),
('Fotokopi Paspor', 'dokumen', 'both', 'Simpan terpisah dari aslinya', true, 4, 2, true),
('Pas Foto', 'dokumen', 'both', 'Foto 4x6 background putih', false, 5, 4, true),
('Kartu Identitas Grup', 'dokumen', 'both', 'ID card dari travel', false, 6, 1, true),

-- Kesehatan
('Obat Pribadi', 'kesehatan', 'both', 'Obat rutin yang dikonsumsi', true, 1, 1, true),
('Vitamin', 'kesehatan', 'both', 'Vitamin C, multivitamin', false, 2, 1, true),
('Obat Flu & Batuk', 'kesehatan', 'both', 'Antisipasi perubahan cuaca', false, 3, 1, true),
('Obat Maag', 'kesehatan', 'both', 'Untuk gangguan pencernaan', false, 4, 1, true),
('Plester Luka', 'kesehatan', 'both', 'Untuk lecet kaki', false, 5, 1, true),
('Hand Sanitizer', 'kesehatan', 'both', 'Pembersih tangan', false, 6, 1, true),
('Masker', 'kesehatan', 'both', 'Masker kesehatan', false, 7, 10, true),

-- Ibadah
('Al-Quran Mini', 'ibadah', 'both', 'Mushaf kecil untuk dibawa', true, 1, 1, true),
('Buku Doa Umroh', 'ibadah', 'both', 'Panduan doa-doa manasik', true, 2, 1, true),
('Sajadah Lipat', 'ibadah', 'both', 'Sajadah travel', false, 3, 1, true),
('Tasbih', 'ibadah', 'both', 'Untuk dzikir', false, 4, 1, true),

-- Perlengkapan
('Tas Kabin', 'perlengkapan', 'both', 'Tas kecil untuk dokumen dan barang penting', true, 1, 1, true),
('Koper', 'perlengkapan', 'both', 'Koper utama untuk pakaian', true, 2, 1, true),
('Tas Sandang', 'perlengkapan', 'both', 'Tas kecil untuk saat ibadah', false, 3, 1, true),
('Powerbank', 'perlengkapan', 'both', 'Untuk charge HP', false, 4, 1, true),
('Charger HP', 'perlengkapan', 'both', 'Charger dan kabel', true, 5, 1, true),
('Adaptor Listrik', 'perlengkapan', 'both', 'Adaptor colokan Saudi type G', false, 6, 1, true),
('Botol Minum', 'perlengkapan', 'both', 'Untuk air zamzam', false, 7, 1, true),
('Payung Lipat', 'perlengkapan', 'both', 'Pelindung panas matahari', false, 8, 1, true),

-- Toiletries
('Sabun Mandi', 'toiletries', 'both', 'Sabun tanpa pewangi (untuk ihram)', true, 1, 1, true),
('Shampoo', 'toiletries', 'both', 'Shampoo tanpa pewangi', true, 2, 1, true),
('Sikat Gigi & Pasta', 'toiletries', 'both', 'Perlengkapan sikat gigi', true, 3, 1, true),
('Handuk Kecil', 'toiletries', 'both', 'Handuk travel', false, 4, 1, true),
('Sunblock', 'toiletries', 'both', 'Pelindung kulit dari matahari', false, 5, 1, true),
('Lip Balm', 'toiletries', 'both', 'Pelembab bibir', false, 6, 1, true);


-- ========================================
-- 5. PRAYER CATEGORIES (Kategori Doa)
-- ========================================
INSERT INTO prayer_categories (name, name_arabic, description, icon, priority, is_active) VALUES
('Doa Harian', 'أدعية يومية', 'Doa-doa sehari-hari yang sering dibaca', 'sun', 1, true),
('Doa Perjalanan', 'أدعية السفر', 'Doa saat bepergian dan dalam perjalanan', 'plane', 2, true),
('Doa Umroh', 'أدعية العمرة', 'Doa khusus saat melaksanakan ibadah umroh', 'kaaba', 3, true),
('Doa di Masjid', 'أدعية المسجد', 'Doa saat masuk dan keluar masjid', 'mosque', 4, true),
('Doa Perlindungan', 'أدعية الحماية', 'Doa memohon perlindungan Allah', 'shield', 5, true),
('Doa Kesehatan', 'أدعية الصحة', 'Doa untuk kesehatan dan kesembuhan', 'heart-pulse', 6, true);


-- ========================================
-- 6. PRAYERS (Doa-Doa)
-- ========================================
DO $$
DECLARE
    cat_harian UUID;
    cat_perjalanan UUID;
    cat_umroh UUID;
    cat_masjid UUID;
    cat_perlindungan UUID;
    cat_kesehatan UUID;
BEGIN
    SELECT id INTO cat_harian FROM prayer_categories WHERE name = 'Doa Harian';
    SELECT id INTO cat_perjalanan FROM prayer_categories WHERE name = 'Doa Perjalanan';
    SELECT id INTO cat_umroh FROM prayer_categories WHERE name = 'Doa Umroh';
    SELECT id INTO cat_masjid FROM prayer_categories WHERE name = 'Doa di Masjid';
    SELECT id INTO cat_perlindungan FROM prayer_categories WHERE name = 'Doa Perlindungan';
    SELECT id INTO cat_kesehatan FROM prayer_categories WHERE name = 'Doa Kesehatan';

    -- Doa Harian
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Bangun Tidur', 'دعاء الاستيقاظ من النوم', 
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُوْرُ',
    'Alhamdulillahil ladzi ahyana ba''da ma amaatana wa ilaihin nusyuur',
    'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami akan dikembalikan',
    cat_harian, 'HR. Bukhari', 1, true),
    
    ('Doa Sebelum Tidur', 'دعاء النوم',
    'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا',
    'Bismikallaahumma amuutu wa ahyaa',
    'Dengan nama-Mu ya Allah, aku mati dan aku hidup',
    cat_harian, 'HR. Bukhari', 2, true),
    
    ('Doa Masuk Kamar Mandi', 'دعاء دخول الخلاء',
    'اللّٰهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    'Allaahumma innii a''uudzubika minal khubutsi wal khabaa''its',
    'Ya Allah, aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan',
    cat_harian, 'HR. Bukhari & Muslim', 3, true),
    
    ('Doa Keluar Kamar Mandi', 'دعاء الخروج من الخلاء',
    'غُفْرَانَكَ',
    'Ghufraanak',
    'Aku mohon ampunan-Mu',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 4, true),
    
    ('Doa Sebelum Makan', 'دعاء قبل الأكل',
    'بِسْمِ اللّٰهِ',
    'Bismillah',
    'Dengan nama Allah',
    cat_harian, 'HR. Abu Dawud', 5, true),
    
    ('Doa Sesudah Makan', 'دعاء بعد الأكل',
    'اَلْحَمْدُ لِلّٰهِ الَّذِيْ أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ',
    'Alhamdulillahil ladzi ath''amana wa saqaana wa ja''alana muslimiin',
    'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami muslim',
    cat_harian, 'HR. Abu Dawud & Tirmidzi', 6, true);

    -- Doa Perjalanan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Naik Kendaraan', 'دعاء ركوب الدابة',
    'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',
    'Subhaanal ladzi sakhkhara lana haadza wa ma kunna lahu muqriniin, wa inna ilaa rabbina lamunqalibuun',
    'Maha Suci Allah yang telah menundukkan ini untuk kami, padahal sebelumnya kami tidak mampu menguasainya, dan sesungguhnya kepada Tuhan kami pasti kami akan kembali',
    cat_perjalanan, 'QS. Az-Zukhruf: 13-14', 1, true),
    
    ('Doa Berangkat Bepergian', 'دعاء السفر',
    'اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِيْ سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى',
    'Allaahumma inna nas''aluka fii safarinaa haadzal birra wat taqwa, wa minal ''amali maa tardhaa',
    'Ya Allah, kami memohon kepada-Mu dalam perjalanan kami ini kebaikan dan ketakwaan, dan amal yang Engkau ridhai',
    cat_perjalanan, 'HR. Muslim', 2, true),
    
    ('Doa Sampai di Tujuan', 'دعاء الوصول',
    'اللّٰهُمَّ رَبَّ السَّمٰوَاتِ السَّبْعِ وَمَا أَظَلَّتْ، وَرَبَّ الْأَرَضِيْنَ وَمَا أَقَلَّتْ، أَسْأَلُكَ خَيْرَ هٰذِهِ الْقَرْيَةِ وَخَيْرَ أَهْلِهَا',
    'Allaahumma rabbas samaawaatis sab''i wa maa adhallat, wa rabbal aradhiina wa maa aqallat, as''aluka khaira haadzihil qaryati wa khaira ahlihaa',
    'Ya Allah, Tuhan langit yang tujuh dan apa yang dinaunginya, Tuhan bumi dan apa yang dikandungnya, aku memohon kebaikan negeri ini dan kebaikan penduduknya',
    cat_perjalanan, 'HR. Ibnu Hibban', 3, true);

    -- Doa Umroh
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Niat Umroh', 'نية العمرة',
    'لَبَّيْكَ اللّٰهُمَّ عُمْرَةً',
    'Labbaikallahumma ''umratan',
    'Aku memenuhi panggilan-Mu ya Allah untuk umroh',
    cat_umroh, 'Hadits Shahih', 1, true),
    
    ('Talbiyah', 'التلبية',
    'لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيْكَ لَكَ',
    'Labbaikallahumma labbaik, labbaika laa syariika laka labbaik, innal hamda wan ni''mata laka wal mulk, laa syariika lak',
    'Aku memenuhi panggilan-Mu ya Allah. Aku memenuhi panggilan-Mu, tidak ada sekutu bagi-Mu. Segala puji, nikmat, dan kerajaan adalah milik-Mu, tidak ada sekutu bagi-Mu',
    cat_umroh, 'HR. Bukhari & Muslim', 2, true),
    
    ('Doa Melihat Ka''bah', 'دعاء رؤية الكعبة',
    'اللّٰهُمَّ زِدْ هٰذَا الْبَيْتَ تَشْرِيْفًا وَتَعْظِيْمًا وَتَكْرِيْمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيْفًا وَتَكْرِيْمًا وَتَعْظِيْمًا وَبِرًّا',
    'Allaahumma zid haadzal baita tasyriifan wa ta''dhiiman wa takriiman wa mahaabatan, wa zid man syarrafahu wa karramahu mimman hajjahu awi''tamarahu tasyriifan wa takriiman wa ta''dhiiman wa birraa',
    'Ya Allah, tambahkanlah kemuliaan, keagungan, kehormatan, dan kewibawaan rumah ini. Dan tambahkanlah kemuliaan, kehormatan, keagungan, dan kebaikan bagi orang yang memuliakan dan menghormatinya, baik yang berhaji maupun berumroh',
    cat_umroh, 'HR. Baihaqi', 3, true),
    
    ('Doa Tawaf', 'دعاء الطواف',
    'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    'Rabbana aatina fid dunya hasanatan wa fil aakhirati hasanatan wa qinaa ''adzaaban naar',
    'Ya Tuhan kami, berikanlah kami kebaikan di dunia dan kebaikan di akhirat, serta lindungilah kami dari siksa api neraka',
    cat_umroh, 'QS. Al-Baqarah: 201', 4, true),
    
    ('Doa Sa''i di Safa', 'دعاء الصفا',
    'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ، أَبْدَأُ بِمَا بَدَأَ اللّٰهُ بِهِ',
    'Innas shafa wal marwata min sya''aa''irillah, abda''u bima bada''allahu bih',
    'Sesungguhnya Safa dan Marwah adalah sebagian syi''ar Allah. Aku mulai dengan apa yang Allah mulai dengannya',
    cat_umroh, 'HR. Muslim', 5, true),
    
    ('Doa Minum Air Zamzam', 'دعاء شرب ماء زمزم',
    'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    'Allaahumma innii as''aluka ''ilman naafi''an wa rizqan waasi''an wa syifaa''an min kulli daa''',
    'Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit',
    cat_umroh, 'HR. Daruquthni', 6, true);

    -- Doa di Masjid
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Masuk Masjid', 'دعاء دخول المسجد',
    'اللّٰهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
    'Allaahummaf tahlii abwaaba rahmatik',
    'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu',
    cat_masjid, 'HR. Muslim', 1, true),
    
    ('Doa Keluar Masjid', 'دعاء الخروج من المسجد',
    'اللّٰهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ',
    'Allaahumma innii as''aluka min fadhlika',
    'Ya Allah, sesungguhnya aku memohon karunia-Mu',
    cat_masjid, 'HR. Muslim', 2, true),
    
    ('Doa Masuk Masjid Nabawi', 'دعاء دخول المسجد النبوي',
    'بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُوْلِ اللّٰهِ، اللّٰهُمَّ اغْفِرْ لِيْ ذُنُوْبِيْ وَافْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
    'Bismillahi was shalaatu was salaamu ''alaa rasuulillah, allaahummagh firlii dzunuubii waftah lii abwaaba rahmatik',
    'Dengan nama Allah, shalawat dan salam atas Rasulullah. Ya Allah ampunilah dosaku dan bukakanlah untukku pintu-pintu rahmat-Mu',
    cat_masjid, 'HR. Muslim', 3, true);

    -- Doa Perlindungan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Perlindungan', 'دعاء الاستعاذة',
    'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    'A''uudzu bikalimaatillaahit taammaati min syarri maa khalaq',
    'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk-Nya',
    cat_perlindungan, 'HR. Muslim', 1, true),
    
    ('Doa Pagi Hari', 'دعاء الصباح',
    'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki pagi dan kerajaan menjadi milik Allah. Segala puji bagi Allah. Tiada Tuhan selain Allah yang Esa, tiada sekutu bagi-Nya',
    cat_perlindungan, 'HR. Abu Dawud', 2, true),
    
    ('Doa Sore Hari', 'دعاء المساء',
    'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ',
    'Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaaha illallaahu wahdahu laa syariikalah',
    'Kami memasuki sore dan kerajaan menjadi milik Allah. Segala puji bagi Allah. Tiada Tuhan selain Allah yang Esa, tiada sekutu bagi-Nya',
    cat_perlindungan, 'HR. Abu Dawud', 3, true);

    -- Doa Kesehatan
    INSERT INTO prayers (title, title_arabic, arabic_text, transliteration, translation, category_id, source, priority, is_active) VALUES
    ('Doa Mohon Kesehatan', 'دعاء طلب الصحة',
    'اللّٰهُمَّ عَافِنِيْ فِيْ بَدَنِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ سَمْعِيْ، اللّٰهُمَّ عَافِنِيْ فِيْ بَصَرِيْ',
    'Allaahumma ''aafini fii badanii, allaahumma ''aafini fii sam''ii, allaahumma ''aafini fii bashari',
    'Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku',
    cat_kesehatan, 'HR. Abu Dawud', 1, true),
    
    ('Doa untuk Orang Sakit', 'دعاء للمريض',
    'اللّٰهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اِشْفِ أَنْتَ الشَّافِيْ، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    'Allaahumma rabban naas, adzhibil ba''s, isyfi antas syaafii, laa syifaa''a illa syifaa''uka, syifaa''an laa yughaadiru saqaman',
    'Ya Allah Tuhan manusia, hilangkanlah penyakitnya, sembuhkanlah. Engkau Maha Penyembuh, tidak ada kesembuhan kecuali kesembuhan dari-Mu, kesembuhan yang tidak menyisakan penyakit',
    cat_kesehatan, 'HR. Bukhari & Muslim', 2, true);

END $$;


-- ========================================
-- 7. HAJI CHECKLISTS (Checklist Haji)
-- ========================================
INSERT INTO haji_checklists (title, description, category, is_required, priority, applies_to, is_active) VALUES
('NIK dan KK', 'Nomor Induk Kependudukan dan Kartu Keluarga asli', 'dokumen', true, 1, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Akta Kelahiran', 'Akta kelahiran asli atau surat kenal lahir', 'dokumen', true, 2, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Buku Nikah/Akta Cerai', 'Untuk yang sudah menikah/bercerai', 'dokumen', false, 3, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Paspor', 'Paspor dengan masa berlaku minimal 6 bulan', 'dokumen', true, 4, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Pas Foto', 'Foto 4x6 background putih, 80% wajah', 'dokumen', true, 5, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Surat Keterangan Sehat', 'Dari dokter/Puskesmas', 'kesehatan', true, 6, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Vaksinasi Meningitis', 'Kartu bukti vaksinasi', 'kesehatan', true, 7, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true),
('Setoran Awal BPIH', 'Bukti setoran awal Rp 25 juta', 'pembayaran', true, 8, ARRAY['haji_reguler'], true),
('Pelunasan BPIH', 'Bukti pelunasan biaya haji', 'pembayaran', true, 9, ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'], true);


-- ========================================
-- 8. PLATFORM SETTINGS (Pengaturan Platform)
-- ========================================
INSERT INTO platform_settings (key, value, description) VALUES
('featured_price_per_day', '{"amount": 50000}', 'Harga kredit per hari untuk featured package'),
('min_featured_duration', '{"days": 7}', 'Minimal durasi featured package'),
('max_featured_duration', '{"days": 30}', 'Maksimal durasi featured package'),
('platform_fee_percentage', '{"percentage": 5}', 'Persentase fee platform dari setiap booking'),
('currency_rates', '{"SAR_to_IDR": 4200}', 'Kurs mata uang Saudi Riyal ke Rupiah')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ========================================
-- 9. MASTER DATA: AIRLINES
-- ========================================
INSERT INTO airlines (name, code, is_active) VALUES
('Garuda Indonesia', 'GA', true),
('Saudi Airlines', 'SV', true),
('Lion Air', 'JT', true),
('Batik Air', 'ID', true),
('Emirates', 'EK', true),
('Qatar Airways', 'QR', true),
('Etihad Airways', 'EY', true),
('Malaysia Airlines', 'MH', true),
('Turkish Airlines', 'TK', true),
('Oman Air', 'WY', true);


-- ========================================
-- 10. MASTER DATA: HOTELS
-- ========================================
INSERT INTO hotels (name, city, star_rating, distance_to_haram, is_active) VALUES
-- Makkah 5 Star
('Fairmont Makkah Clock Tower', 'Makkah', 5, '100m', true),
('Raffles Makkah Palace', 'Makkah', 5, '100m', true),
('Conrad Makkah', 'Makkah', 5, '200m', true),
('Jabal Omar Hyatt Regency', 'Makkah', 5, '200m', true),
('Swissotel Makkah', 'Makkah', 5, '300m', true),
-- Makkah 4 Star
('Anjum Hotel Makkah', 'Makkah', 4, '400m', true),
('Al Marwa Rayhaan by Rotana', 'Makkah', 4, '500m', true),
('Movenpick Hotel & Residence Hajar Tower', 'Makkah', 4, '100m', true),
('Elaf Ajyad Hotel', 'Makkah', 4, '600m', true),
('Le Meridien Makkah', 'Makkah', 4, '800m', true),
-- Makkah 3 Star
('Dar Al Ghufran Hotel', 'Makkah', 3, '1km', true),
('Al Safwah Tower', 'Makkah', 3, '200m', true),
-- Madinah 5 Star
('Oberoi Madinah', 'Madinah', 5, '100m', true),
('Anwar Al Madinah Movenpick', 'Madinah', 5, '200m', true),
('Crowne Plaza Madinah', 'Madinah', 5, '300m', true),
-- Madinah 4 Star
('Dar Al Taqwa Hotel', 'Madinah', 4, '50m', true),
('Millennium Al Aqeeq Madinah', 'Madinah', 4, '400m', true),
('Dallah Taibah Hotel', 'Madinah', 4, '200m', true),
('Shaza Al Madina', 'Madinah', 4, '300m', true),
-- Madinah 3 Star
('Al Eiman Taibah Hotel', 'Madinah', 3, '500m', true),
('Al Haram Hotel', 'Madinah', 3, '100m', true);


-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Database siap digunakan.
-- Silakan test dengan mendaftar user baru.
-- =====================================================
