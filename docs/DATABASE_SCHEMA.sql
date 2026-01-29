-- =====================================================
-- ARAH UMROH - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 1.0.0
-- Last Updated: 2025-01-29
-- Description: Complete SQL schema for Arah Umroh marketplace
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

-- Prayers (Doa) Table
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
-- RLS POLICIES (Sample - Core tables)
-- =====================================================

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

-- Bookings policies
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can update bookings" ON public.bookings FOR UPDATE USING (owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'));

-- Public content policies
CREATE POLICY "Anyone can view active manasik" ON public.manasik_guides FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage manasik" ON public.manasik_guides FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active locations" ON public.important_locations FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage locations" ON public.important_locations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active prayers" ON public.prayers FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage prayers" ON public.prayers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECTION 16: STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-logos', 'travel-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('package-images', 'package-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('prayer-audio', 'prayer-audio', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('haji-documents', 'haji-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

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

-- =====================================================
-- SECTION 17: REALTIME
-- =====================================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
