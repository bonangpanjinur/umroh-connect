-- ============================================
-- CONSOLIDATED MIGRATION - Full Database Schema
-- Generated from live database
-- ============================================

-- ==========================================
-- ENUMS
-- ==========================================
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('jamaah', 'agent', 'admin', 'shop_admin', 'seller'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.checklist_category AS ENUM ('dokumen', 'perlengkapan', 'kesehatan', 'mental'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion', 'rating', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.package_type AS ENUM ('umroh', 'haji_reguler', 'haji_plus', 'haji_furoda'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.shop_order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION public.generate_booking_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: AU-YYYYMMDD-XXXX (AU = Arah Umroh)
    new_code := 'AU-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    
    -- Check if code exists
    SELECT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_group_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    new_code := upper(substr(md5(random()::text), 1, 6));
    
    SELECT EXISTS (SELECT 1 FROM public.tracking_groups WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_shop_order_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'SH-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS (SELECT 1 FROM public.shop_orders WHERE order_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END; $function$
;

CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'jamaah');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'jamaah');
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_id UUID;
  sender_name_val TEXT;
BEGIN
  -- Determine recipient: if sender is buyer, notify seller; if seller, notify buyer
  IF NEW.sender_role = 'buyer' THEN
    -- Find seller's user_id from seller_profiles
    SELECT user_id INTO recipient_id
    FROM public.seller_profiles
    WHERE id = NEW.seller_id;
  ELSE
    -- For seller messages, we need to find the buyer
    -- Get the most recent buyer in this conversation
    SELECT DISTINCT sender_id INTO recipient_id
    FROM public.shop_chat_messages
    WHERE seller_id = NEW.seller_id
      AND sender_role = 'buyer'
      AND (NEW.order_id IS NULL OR order_id = NEW.order_id)
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Get sender name
  SELECT full_name INTO sender_name_val
  FROM public.profiles
  WHERE user_id = NEW.sender_id
  LIMIT 1;

  -- Don't notify yourself
  IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.chat_notifications (user_id, chat_message_id, seller_id, sender_name, message_preview)
    VALUES (recipient_id, NEW.id, NEW.seller_id, COALESCE(sender_name_val, 'Pengguna'), LEFT(NEW.message, 100));
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  seller_user_id UUID;
BEGIN
  -- Find the seller from order items
  SELECT sp.user_id INTO seller_user_id
  FROM public.shop_order_items soi
  JOIN public.shop_products p ON soi.product_id = p.id
  JOIN public.seller_profiles sp ON p.seller_id = sp.id
  WHERE soi.order_id = NEW.id
  LIMIT 1;

  IF seller_user_id IS NOT NULL THEN
    INSERT INTO public.order_notifications (user_id, order_id, type, message)
    VALUES (seller_user_id, NEW.id, 'new_order', 'Pesanan baru ' || NEW.order_code || ' menunggu pembayaran');
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  buyer_id UUID;
  seller_user_id UUID;
  status_label TEXT;
  order_code_val TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    buyer_id := NEW.user_id;
    order_code_val := NEW.order_code;

    -- Status labels
    CASE NEW.status
      WHEN 'paid' THEN status_label := 'Pembayaran dikonfirmasi';
      WHEN 'processing' THEN status_label := 'Sedang diproses';
      WHEN 'shipped' THEN status_label := 'Sedang dikirim';
      WHEN 'delivered' THEN status_label := 'Telah diterima';
      WHEN 'cancelled' THEN status_label := 'Dibatalkan';
      ELSE status_label := NEW.status;
    END CASE;

    -- Notify buyer
    INSERT INTO public.order_notifications (user_id, order_id, type, message)
    VALUES (buyer_id, NEW.id, 'status_change', 'Pesanan ' || order_code_val || ': ' || status_label);

    -- Notify seller for new paid orders
    IF NEW.status = 'paid' THEN
      SELECT sp.user_id INTO seller_user_id
      FROM public.shop_order_items soi
      JOIN public.shop_products p ON soi.product_id = p.id
      JOIN public.seller_profiles sp ON p.seller_id = sp.id
      WHERE soi.order_id = NEW.id
      LIMIT 1;

      IF seller_user_id IS NOT NULL THEN
        INSERT INTO public.order_notifications (user_id, order_id, type, message)
        VALUES (seller_user_id, NEW.id, 'new_order', 'Pesanan baru ' || order_code_val || ' telah dibayar');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.owns_departure(_user_id uuid, _departure_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.departures d
    JOIN public.packages pkg ON d.package_id = pkg.id
    JOIN public.travels t ON pkg.travel_id = t.id
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE d.id = _departure_id AND p.user_id = _user_id
  )
$function$
;

CREATE OR REPLACE FUNCTION public.owns_package(_user_id uuid, _package_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.packages pkg
    JOIN public.travels t ON pkg.travel_id = t.id
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE pkg.id = _package_id AND p.user_id = _user_id
  )
$function$
;

CREATE OR REPLACE FUNCTION public.owns_travel(_user_id uuid, _travel_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.travels t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE t.id = _travel_id AND p.user_id = _user_id
  )
$function$
;

CREATE OR REPLACE FUNCTION public.record_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_booking_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_group_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_group_code();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_shop_order_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := generate_shop_order_code();
  END IF;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.update_booking_paid_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_seller_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating NUMERIC;
  total_reviews INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.seller_reviews
  WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
    AND is_published = true;

  UPDATE public.seller_profiles
  SET rating = ROUND(avg_rating, 2),
      review_count = total_reviews
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_shop_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    UPDATE public.shop_products sp SET stock = stock - soi.quantity
    FROM public.shop_order_items soi WHERE soi.order_id = NEW.id AND sp.id = soi.product_id;
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IN ('paid', 'processing') THEN
    UPDATE public.shop_products sp SET stock = stock + soi.quantity
    FROM public.shop_order_items soi WHERE soi.order_id = NEW.id AND sp.id = soi.product_id;
  END IF;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.update_travel_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate new average rating and count
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.travel_reviews
  WHERE travel_id = COALESCE(NEW.travel_id, OLD.travel_id)
    AND is_published = true;
  
  -- Update the travel record
  UPDATE public.travels
  SET 
    rating = ROUND(avg_rating, 1),
    review_count = review_count
  WHERE id = COALESCE(NEW.travel_id, OLD.travel_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

-- ==========================================
-- TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.agent_applications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    travel_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    documents TEXT[],
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.agent_notifications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.agent_website_settings (
    user_id UUID PRIMARY KEY NOT NULL,
    slug TEXT,
    custom_slug TEXT,
    slug_status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    is_builder_active BOOLEAN DEFAULT false,
    is_pro_active BOOLEAN DEFAULT false,
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    fb_pixel_id TEXT,
    google_analytics_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (slug)
);
ALTER TABLE public.agent_website_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.airlines (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position TEXT NOT NULL DEFAULT 'home',
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    travel_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID NOT NULL,
    departure_id UUID,
    travel_id UUID NOT NULL,
    booking_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    number_of_pilgrims INTEGER NOT NULL DEFAULT 1,
    total_price BIGINT NOT NULL,
    paid_amount BIGINT NOT NULL DEFAULT 0,
    remaining_amount BIGINT,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    notes TEXT,
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    departure_reminder_h30 BOOLEAN DEFAULT false,
    departure_reminder_h14 BOOLEAN DEFAULT false,
    departure_reminder_h7 BOOLEAN DEFAULT false,
    departure_reminder_h3 BOOLEAN DEFAULT false,
    departure_reminder_h1 BOOLEAN DEFAULT false,
    departure_reminder_h0 BOOLEAN DEFAULT false,
    UNIQUE (booking_code)
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    booking_id UUID,
    travel_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_notifications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chat_message_id UUID,
    seller_id UUID NOT NULL,
    sender_name TEXT,
    message_preview TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category public.checklist_category NOT NULL,
    phase TEXT NOT NULL DEFAULT 'H-30',
    priority INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.content_ratings (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, content_type, content_id)
);
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    price BIGINT,
    package_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.departure_notification_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.departure_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.departures (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    price BIGINT NOT NULL,
    original_price BIGINT,
    available_seats INTEGER NOT NULL DEFAULT 45,
    total_seats INTEGER NOT NULL DEFAULT 45,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dzikir_types (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    default_target INTEGER DEFAULT 33,
    category TEXT DEFAULT 'umum',
    icon TEXT DEFAULT 'circle',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.dzikir_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exercise_types (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'activity',
    description TEXT,
    intensity TEXT NOT NULL DEFAULT 'ringan',
    recommended_time TEXT DEFAULT 'setelah_tarawih',
    duration_minutes INTEGER DEFAULT 15,
    is_ramadan_friendly BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.featured_packages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    travel_id UUID NOT NULL,
    position TEXT NOT NULL DEFAULT 'home',
    priority INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_packages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    feedback_type public.feedback_type NOT NULL DEFAULT 'other',
    title TEXT NOT NULL,
    description TEXT,
    rating INTEGER,
    category TEXT,
    screenshot_url TEXT,
    device_info JSONB,
    app_version TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.geofence_alerts (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    geofence_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    alert_type TEXT NOT NULL DEFAULT 'exit',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    distance_from_center DOUBLE PRECISION,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.geofences (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 500,
    zone_type TEXT NOT NULL DEFAULT 'hotel',
    group_id UUID,
    travel_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.group_locations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    battery_level INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_sharing BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.haji_checklists (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'dokumen',
    is_required BOOLEAN DEFAULT true,
    applies_to TEXT[] DEFAULT ARRAY['haji_reguler', 'haji_plus', 'haji_furoda'],
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.haji_checklists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.haji_registrations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_id UUID NOT NULL,
    travel_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    nik TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    birth_date DATE NOT NULL,
    address TEXT,
    porsi_number TEXT,
    registration_year INTEGER,
    estimated_departure_year INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    documents JSONB DEFAULT '{}',
    dp_amount BIGINT DEFAULT 0,
    dp_paid_at TIMESTAMP WITH TIME ZONE,
    agent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.haji_registrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Makkah',
    star_rating INTEGER NOT NULL DEFAULT 4,
    distance_to_haram TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ibadah_habits (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'wajib',
    icon TEXT,
    target_count INTEGER DEFAULT 1,
    is_ramadan_specific BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ibadah_habits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.important_locations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'masjid',
    city TEXT NOT NULL DEFAULT 'Makkah',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    opening_hours TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.important_locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.journal_photos (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    location_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    mood TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.manasik_guides (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_arabic TEXT,
    description TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'umroh',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    audio_url TEXT,
    doa_arabic TEXT,
    doa_latin TEXT,
    doa_meaning TEXT
);
ALTER TABLE public.manasik_guides ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'basic',
    status TEXT NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    amount BIGINT NOT NULL DEFAULT 0,
    payment_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notify_new_order BOOLEAN NOT NULL DEFAULT true,
    notify_status_change BOOLEAN NOT NULL DEFAULT true,
    notify_chat_message BOOLEAN NOT NULL DEFAULT true,
    notify_payment_reminder BOOLEAN NOT NULL DEFAULT true,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_notifications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_id UUID,
    type TEXT NOT NULL DEFAULT 'status_change',
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_credits (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (travel_id)
);
ALTER TABLE public.package_credits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_inquiries (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    departure_id UUID,
    travel_id UUID NOT NULL,
    user_id UUID,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT,
    number_of_people INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    agent_notes TEXT,
    contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.package_inquiries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.package_interests (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    departure_id UUID,
    user_id UUID,
    interest_type TEXT NOT NULL DEFAULT 'view',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.package_interests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL DEFAULT 9,
    hotel_makkah TEXT,
    hotel_madinah TEXT,
    hotel_star INTEGER DEFAULT 4,
    airline TEXT,
    flight_type TEXT DEFAULT 'direct',
    meal_type TEXT DEFAULT 'fullboard',
    facilities TEXT[] DEFAULT '{}'[],
    images TEXT[] DEFAULT '{}'[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    package_type public.package_type NOT NULL DEFAULT 'umroh',
    haji_year INTEGER,
    haji_season TEXT,
    quota_type TEXT,
    estimated_departure_year INTEGER,
    min_dp BIGINT,
    registration_deadline DATE,
    age_requirement TEXT,
    health_requirements TEXT[]
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.packing_templates (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pakaian',
    gender TEXT NOT NULL DEFAULT 'both',
    is_essential BOOLEAN DEFAULT false,
    weather_related BOOLEAN DEFAULT false,
    description TEXT,
    quantity_suggestion INTEGER DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.packing_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.page_versions (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    page_id UUID,
    content TEXT,
    layout_data JSONB,
    design_data JSONB,
    version_name TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payment_notification_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID,
    payment_schedule_id UUID,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.payment_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payment_schedules (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    payment_type TEXT NOT NULL,
    amount BIGINT NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount BIGINT DEFAULT 0,
    payment_proof_url TEXT,
    reminder_sent_h7 BOOLEAN DEFAULT false,
    reminder_sent_h3 BOOLEAN DEFAULT false,
    reminder_sent_h1 BOOLEAN DEFAULT false,
    reminder_sent_overdue BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (key)
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.prayer_categories (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    description TEXT,
    icon TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    category_id UUID,
    title TEXT NOT NULL,
    title_arabic TEXT,
    arabic_text TEXT NOT NULL,
    transliteration TEXT,
    translation TEXT,
    source TEXT,
    benefits TEXT,
    audio_url TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (product_id, order_id, user_id)
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_wishlist (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);
ALTER TABLE public.product_wishlist ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'jamaah',
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    suspension_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    email TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    shipping_phone TEXT,
    passport_number TEXT,
    passport_expiry DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    umrah_count INTEGER DEFAULT 0,
    hajj_count INTEGER DEFAULT 0,
    UNIQUE (user_id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_ayahs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    ayah_global INTEGER,
    arabic_text TEXT NOT NULL,
    translation_id TEXT,
    juz INTEGER,
    page INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (surah_number, ayah_number)
);
ALTER TABLE public.quran_ayahs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_khatam_targets (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_date DATE NOT NULL,
    pages_per_day NUMERIC DEFAULT 0,
    ayat_per_day INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.quran_khatam_targets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_last_read (
    user_id UUID PRIMARY KEY NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    juz_number INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.quran_last_read ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_surahs (
    id INTEGER PRIMARY KEY NOT NULL DEFAULT nextval('quran_surahs_id_seq'),
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    name_arabic TEXT NOT NULL,
    total_verses INTEGER NOT NULL,
    juz_start INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    revelation_type TEXT,
    english_name TEXT,
    translation_name TEXT,
    UNIQUE (number)
);
ALTER TABLE public.quran_surahs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_sync_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL DEFAULT 'full',
    surahs_synced INTEGER DEFAULT 0,
    ayahs_synced INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'running',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.quran_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_tadarus_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    read_date DATE NOT NULL DEFAULT CURRENT_DATE,
    surah_start INTEGER NOT NULL,
    ayah_start INTEGER NOT NULL,
    surah_end INTEGER NOT NULL,
    ayah_end INTEGER NOT NULL,
    total_verses INTEGER NOT NULL,
    juz_start INTEGER DEFAULT 1,
    juz_end INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.quran_tadarus_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quran_tips (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'motivasi',
    day_number INTEGER,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.quran_tips ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sedekah_types (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_arabic TEXT,
    icon TEXT DEFAULT 'heart',
    description TEXT,
    category TEXT NOT NULL DEFAULT 'uang',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sedekah_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    shop_name TEXT NOT NULL,
    description TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    documents TEXT[],
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_credit_transactions (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    product_id UUID,
    price BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_credits (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (seller_id)
);
ALTER TABLE public.seller_credits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_featured_products (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    product_id UUID NOT NULL,
    position TEXT DEFAULT 'homepage',
    priority INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_featured_products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_membership_plans (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    max_products INTEGER NOT NULL DEFAULT 5,
    max_featured INTEGER NOT NULL DEFAULT 0,
    price_monthly BIGINT NOT NULL DEFAULT 0,
    price_yearly BIGINT NOT NULL DEFAULT 0,
    features TEXT[] DEFAULT '{}'[],
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_membership_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_memberships (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    plan_id UUID,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    payment_proof_url TEXT,
    amount BIGINT DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_profiles (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    shop_name TEXT NOT NULL,
    shop_description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    shipping_cost INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id)
);
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_reviews (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_id UUID,
    rating INTEGER NOT NULL,
    review_text TEXT,
    is_published BOOLEAN DEFAULT true,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_cart_items (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (cart_id, product_id)
);
ALTER TABLE public.shop_cart_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_carts (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_carts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_categories (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (slug)
);
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_chat_messages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID,
    seller_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    attachment_url TEXT,
    attachment_type TEXT
);
ALTER TABLE public.shop_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_order_items (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID,
    product_name TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_orders (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_code TEXT NOT NULL DEFAULT '',
    status public.shop_order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    shipping_name TEXT,
    shipping_phone TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_postal_code TEXT,
    notes TEXT,
    payment_proof_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tracking_number TEXT,
    courier TEXT,
    seller_id UUID,
    UNIQUE (order_code)
);
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shop_products (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    category_id UUID,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    compare_price NUMERIC,
    stock INTEGER NOT NULL DEFAULT 0,
    weight_gram INTEGER,
    thumbnail_url TEXT,
    images TEXT[] DEFAULT '{}'[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    seller_id UUID,
    UNIQUE (slug)
);
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.static_pages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT true,
    page_type TEXT DEFAULT 'standard',
    layout_data JSONB DEFAULT '[]',
    design_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (slug)
);
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_yearly BIGINT NOT NULL DEFAULT 0,
    features TEXT[] DEFAULT '{}'[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tracking_groups (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_by UUID NOT NULL,
    travel_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (code)
);
ALTER TABLE public.tracking_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.travel_reviews (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    travel_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (travel_id, user_id)
);
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.travels (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active',
    approval_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID
);
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, achievement_key)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_checklists (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    checklist_id UUID NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, checklist_id)
);
ALTER TABLE public.user_checklists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_custom_habits (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    icon TEXT,
    target_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_custom_habits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_dzikir_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    dzikir_type_id UUID,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    target_count INTEGER DEFAULT 33,
    session_id TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_dzikir_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_exercise_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    exercise_type_id UUID,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    intensity TEXT DEFAULT 'ringan',
    notes TEXT,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_of_day TEXT DEFAULT 'setelah_tarawih',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_ibadah_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    habit_id UUID NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, habit_id, log_date)
);
ALTER TABLE public.user_ibadah_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_ibadah_streaks (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    habit_id UUID,
    custom_habit_id UUID,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, custom_habit_id),
    UNIQUE (user_id, habit_id)
);
ALTER TABLE public.user_ibadah_streaks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_meal_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL,
    is_skipped BOOLEAN DEFAULT false,
    water_glasses INTEGER DEFAULT 0,
    protein_source TEXT,
    carb_source TEXT,
    vegetables TEXT,
    fruits TEXT,
    notes TEXT,
    is_healthy BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, log_date, meal_type)
);
ALTER TABLE public.user_meal_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_quran_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    surah_number INTEGER NOT NULL,
    start_verse INTEGER NOT NULL DEFAULT 1,
    end_verse INTEGER NOT NULL,
    pages_read NUMERIC,
    juz_number INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, log_date, surah_number, start_verse)
);
ALTER TABLE public.user_quran_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_ramadan_settings (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ramadan_year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
    sedekah_target NUMERIC DEFAULT 0,
    tilawah_target_pages INTEGER DEFAULT 20,
    enable_sedekah_reminder BOOLEAN DEFAULT true,
    enable_exercise_reminder BOOLEAN DEFAULT true,
    enable_lailatul_qadar_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
ALTER TABLE public.user_ramadan_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_sedekah_logs (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    sedekah_type_id UUID,
    amount NUMERIC DEFAULT 0,
    description TEXT,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_subuh_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_sedekah_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_proof_url TEXT,
    payment_amount BIGINT,
    payment_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id)
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.website_templates (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (slug)
);
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_agent_notifications_travel ON public.agent_notifications USING btree (travel_id);
CREATE INDEX idx_agent_notifications_unread ON public.agent_notifications USING btree (travel_id, is_read) WHERE (is_read = false);
CREATE INDEX idx_agent_website_settings_custom_slug ON public.agent_website_settings USING btree (custom_slug);
CREATE INDEX idx_agent_website_settings_slug ON public.agent_website_settings USING btree (slug);
CREATE INDEX idx_bookings_departure_reminders ON public.bookings USING btree (departure_id) WHERE (departure_id IS NOT NULL);
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX idx_bookings_travel_id ON public.bookings USING btree (travel_id);
CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);
CREATE INDEX idx_chat_messages_booking ON public.chat_messages USING btree (booking_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages USING btree (created_at DESC);
CREATE INDEX idx_chat_messages_travel ON public.chat_messages USING btree (travel_id);
CREATE INDEX idx_departure_notifications_user ON public.departure_notification_logs USING btree (user_id, sent_at DESC);
CREATE INDEX idx_departures_departure_date ON public.departures USING btree (departure_date);
CREATE INDEX idx_departures_package_id ON public.departures USING btree (package_id);
CREATE INDEX idx_departures_status ON public.departures USING btree (status);
CREATE INDEX idx_featured_packages_active ON public.featured_packages USING btree (status, end_date) WHERE (status = 'active'::text);
CREATE INDEX idx_featured_packages_position ON public.featured_packages USING btree ("position", priority DESC);
CREATE INDEX idx_geofence_alerts_created_at ON public.geofence_alerts USING btree (created_at DESC);
CREATE INDEX idx_geofence_alerts_geofence_id ON public.geofence_alerts USING btree (geofence_id);
CREATE INDEX idx_geofence_alerts_user_id ON public.geofence_alerts USING btree (user_id);
CREATE INDEX idx_geofences_group_id ON public.geofences USING btree (group_id);
CREATE UNIQUE INDEX idx_group_locations_user_group ON public.group_locations USING btree (group_id, user_id);
CREATE INDEX idx_haji_registrations_status ON public.haji_registrations USING btree (status);
CREATE INDEX idx_haji_registrations_travel ON public.haji_registrations USING btree (travel_id);
CREATE INDEX idx_haji_registrations_user ON public.haji_registrations USING btree (user_id);
CREATE INDEX idx_important_locations_category ON public.important_locations USING btree (category);
CREATE INDEX idx_important_locations_city ON public.important_locations USING btree (city);
CREATE INDEX idx_inquiries_created_at ON public.package_inquiries USING btree (created_at DESC);
CREATE INDEX idx_inquiries_status ON public.package_inquiries USING btree (status);
CREATE INDEX idx_inquiries_travel_id ON public.package_inquiries USING btree (travel_id);
CREATE INDEX idx_manasik_guides_order ON public.manasik_guides USING btree (order_index);
CREATE INDEX idx_order_status_history_order ON public.order_status_history USING btree (order_id, created_at);
CREATE INDEX idx_package_interests_created_at ON public.package_interests USING btree (created_at);
CREATE INDEX idx_package_interests_package_id ON public.package_interests USING btree (package_id);
CREATE INDEX idx_packages_is_active ON public.packages USING btree (is_active);
CREATE INDEX idx_packages_travel_id ON public.packages USING btree (travel_id);
CREATE INDEX idx_packages_type ON public.packages USING btree (package_type);
CREATE INDEX idx_packing_templates_category ON public.packing_templates USING btree (category);
CREATE INDEX idx_packing_templates_gender ON public.packing_templates USING btree (gender);
CREATE INDEX idx_payment_notification_logs_user_id ON public.payment_notification_logs USING btree (user_id);
CREATE INDEX idx_payment_schedules_booking_id ON public.payment_schedules USING btree (booking_id);
CREATE INDEX idx_payment_schedules_due_date ON public.payment_schedules USING btree (due_date);
CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX idx_quran_ayahs_juz ON public.quran_ayahs USING btree (juz);
CREATE INDEX idx_quran_ayahs_surah ON public.quran_ayahs USING btree (surah_number);
CREATE INDEX idx_quran_tadarus_logs_user_date ON public.quran_tadarus_logs USING btree (user_id, read_date);
CREATE INDEX idx_static_pages_slug ON public.static_pages USING btree (slug);
CREATE INDEX idx_travels_owner_id ON public.travels USING btree (owner_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- ==========================================
-- RLS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.agent_applications;
CREATE POLICY "Admins can manage all applications" ON public.agent_applications FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create applications" ON public.agent_applications;
CREATE POLICY "Users can create applications" ON public.agent_applications FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) AND (status = 'pending'::text)));
DROP POLICY IF EXISTS "Users can view own applications" ON public.agent_applications;
CREATE POLICY "Users can view own applications" ON public.agent_applications FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can update own notifications" ON public.agent_notifications;
CREATE POLICY "Agents can update own notifications" ON public.agent_notifications FOR UPDATE TO public USING (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Agents can view own notifications" ON public.agent_notifications;
CREATE POLICY "Agents can view own notifications" ON public.agent_notifications FOR SELECT TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Service role creates notifications" ON public.agent_notifications;
CREATE POLICY "Service role creates notifications" ON public.agent_notifications FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR owns_travel(auth.uid(), travel_id)));
DROP POLICY IF EXISTS "Admins can manage all website settings" ON public.agent_website_settings;
CREATE POLICY "Admins can manage all website settings" ON public.agent_website_settings FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can insert own website settings" ON public.agent_website_settings;
CREATE POLICY "Users can insert own website settings" ON public.agent_website_settings FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own website settings" ON public.agent_website_settings;
CREATE POLICY "Users can update own website settings" ON public.agent_website_settings FOR UPDATE TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can view own website settings" ON public.agent_website_settings;
CREATE POLICY "Users can view own website settings" ON public.agent_website_settings FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage airlines" ON public.airlines;
CREATE POLICY "Admins can manage airlines" ON public.airlines FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active airlines" ON public.airlines;
CREATE POLICY "Anyone can view active airlines" ON public.airlines FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all banners" ON public.banners;
CREATE POLICY "Admins can manage all banners" ON public.banners FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT TO public USING (((is_active = true) AND ((start_date IS NULL) OR (start_date <= now())) AND ((end_date IS NULL) OR (end_date >= now()))));
DROP POLICY IF EXISTS "Agents can delete bookings" ON public.bookings;
CREATE POLICY "Agents can delete bookings" ON public.bookings FOR DELETE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can update bookings" ON public.bookings;
CREATE POLICY "Agents can update bookings" ON public.bookings FOR UPDATE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO public USING (((auth.uid() = user_id) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;
CREATE POLICY "Users can mark messages as read" ON public.chat_messages FOR UPDATE TO public USING (((EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = chat_messages.booking_id) AND (b.user_id = auth.uid())))) OR owns_travel(auth.uid(), travel_id) OR ((booking_id IS NULL) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM chat_messages cm2
  WHERE ((cm2.travel_id = chat_messages.travel_id) AND (cm2.booking_id IS NULL) AND (cm2.sender_id = auth.uid())))))));
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT TO public WITH CHECK (((auth.uid() = sender_id) AND ((EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = chat_messages.booking_id) AND (b.user_id = auth.uid())))) OR owns_travel(auth.uid(), travel_id) OR ((booking_id IS NULL) AND (auth.uid() IS NOT NULL)))));
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chat_messages;
CREATE POLICY "Users can view their own chats" ON public.chat_messages FOR SELECT TO public USING (((auth.uid() = sender_id) OR (EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = chat_messages.booking_id) AND (b.user_id = auth.uid())))) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role) OR ((booking_id IS NULL) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM chat_messages cm2
  WHERE ((cm2.travel_id = chat_messages.travel_id) AND (cm2.booking_id IS NULL) AND (cm2.sender_id = auth.uid())))))));
DROP POLICY IF EXISTS "Authenticated users can insert chat notifications" ON public.chat_notifications;
CREATE POLICY "Authenticated users can insert chat notifications" ON public.chat_notifications FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Users can update their own chat notifications" ON public.chat_notifications;
CREATE POLICY "Users can update their own chat notifications" ON public.chat_notifications FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view their own chat notifications" ON public.chat_notifications;
CREATE POLICY "Users can view their own chat notifications" ON public.chat_notifications FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage checklists" ON public.checklists;
CREATE POLICY "Admins can manage checklists" ON public.checklists FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active checklists" ON public.checklists;
CREATE POLICY "Anyone can view active checklists" ON public.checklists FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.content_ratings;
CREATE POLICY "Admins can manage all ratings" ON public.content_ratings FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.content_ratings;
CREATE POLICY "Anyone can view ratings" ON public.content_ratings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can create own ratings" ON public.content_ratings;
CREATE POLICY "Users can create own ratings" ON public.content_ratings FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own ratings" ON public.content_ratings;
CREATE POLICY "Users can update own ratings" ON public.content_ratings FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Agents can create usage transactions" ON public.credit_transactions;
CREATE POLICY "Agents can create usage transactions" ON public.credit_transactions FOR INSERT TO public WITH CHECK ((owns_travel(auth.uid(), travel_id) AND (transaction_type = 'usage'::text)));
DROP POLICY IF EXISTS "Agents can view own transactions" ON public.credit_transactions;
CREATE POLICY "Agents can view own transactions" ON public.credit_transactions FOR SELECT TO public USING (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Users can read own departure notifications" ON public.departure_notification_logs;
CREATE POLICY "Users can read own departure notifications" ON public.departure_notification_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own departure notifications" ON public.departure_notification_logs;
CREATE POLICY "Users can update own departure notifications" ON public.departure_notification_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Agents can create departures" ON public.departures;
CREATE POLICY "Agents can create departures" ON public.departures FOR INSERT TO public WITH CHECK ((owns_package(auth.uid(), package_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view departures" ON public.departures;
CREATE POLICY "Anyone can view departures" ON public.departures FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM packages
  WHERE ((packages.id = departures.package_id) AND (packages.is_active = true)))) OR owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owners can delete departures" ON public.departures;
CREATE POLICY "Owners can delete departures" ON public.departures FOR DELETE TO public USING ((owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owners can update departures" ON public.departures;
CREATE POLICY "Owners can update departures" ON public.departures FOR UPDATE TO public USING ((owns_departure(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage dzikir types" ON public.dzikir_types;
CREATE POLICY "Admins can manage dzikir types" ON public.dzikir_types FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active dzikir types" ON public.dzikir_types;
CREATE POLICY "Anyone can view active dzikir types" ON public.dzikir_types FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage exercise types" ON public.exercise_types;
CREATE POLICY "Admins can manage exercise types" ON public.exercise_types FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active exercise types" ON public.exercise_types;
CREATE POLICY "Anyone can view active exercise types" ON public.exercise_types FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all featured packages" ON public.featured_packages;
CREATE POLICY "Admins can manage all featured packages" ON public.featured_packages FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Agents can create featured packages" ON public.featured_packages;
CREATE POLICY "Agents can create featured packages" ON public.featured_packages FOR INSERT TO public WITH CHECK (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Agents can view own featured packages" ON public.featured_packages;
CREATE POLICY "Agents can view own featured packages" ON public.featured_packages FOR SELECT TO public USING (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Anyone can view active featured packages" ON public.featured_packages;
CREATE POLICY "Anyone can view active featured packages" ON public.featured_packages FOR SELECT TO public USING (((status = 'active'::text) AND (end_date >= now())));
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedbacks;
CREATE POLICY "Admins can manage all feedback" ON public.feedbacks FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedbacks;
CREATE POLICY "Users can create feedback" ON public.feedbacks FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedbacks;
CREATE POLICY "Users can view own feedback" ON public.feedbacks FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can acknowledge alerts" ON public.geofence_alerts;
CREATE POLICY "Agents can acknowledge alerts" ON public.geofence_alerts FOR UPDATE TO public USING ((has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (geofence_id IN ( SELECT geofences.id
   FROM geofences
  WHERE (geofences.created_by = auth.uid())))));
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON public.geofence_alerts;
CREATE POLICY "Authenticated users can create alerts" ON public.geofence_alerts FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Users can view alerts for their groups" ON public.geofence_alerts;
CREATE POLICY "Users can view alerts for their groups" ON public.geofence_alerts FOR SELECT TO public USING (((user_id = auth.uid()) OR (geofence_id IN ( SELECT geofences.id
   FROM geofences
  WHERE (geofences.created_by = auth.uid()))) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Creators can delete their geofences" ON public.geofences;
CREATE POLICY "Creators can delete their geofences" ON public.geofences FOR DELETE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Creators can update their geofences" ON public.geofences;
CREATE POLICY "Creators can update their geofences" ON public.geofences FOR UPDATE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Group creators and agents can create geofences" ON public.geofences;
CREATE POLICY "Group creators and agents can create geofences" ON public.geofences FOR INSERT TO public WITH CHECK (((created_by = auth.uid()) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can view geofences for their groups" ON public.geofences;
CREATE POLICY "Users can view geofences for their groups" ON public.geofences FOR SELECT TO public USING (((group_id IN ( SELECT group_locations.group_id
   FROM group_locations
  WHERE (group_locations.user_id = auth.uid()))) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Group members can view all locations in their group" ON public.group_locations;
CREATE POLICY "Group members can view all locations in their group" ON public.group_locations FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM group_locations gl
  WHERE ((gl.group_id = gl.group_id) AND (gl.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM tracking_groups tg
  WHERE ((tg.id = group_locations.group_id) AND (tg.created_by = auth.uid()))))));
DROP POLICY IF EXISTS "Users can delete their own location" ON public.group_locations;
CREATE POLICY "Users can delete their own location" ON public.group_locations FOR DELETE TO public USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert their own location" ON public.group_locations;
CREATE POLICY "Users can insert their own location" ON public.group_locations FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update their own location" ON public.group_locations;
CREATE POLICY "Users can update their own location" ON public.group_locations FOR UPDATE TO public USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage haji checklists" ON public.haji_checklists;
CREATE POLICY "Admins can manage haji checklists" ON public.haji_checklists FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view haji checklists" ON public.haji_checklists;
CREATE POLICY "Anyone can view haji checklists" ON public.haji_checklists FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can delete haji registrations" ON public.haji_registrations;
CREATE POLICY "Agents can delete haji registrations" ON public.haji_registrations FOR DELETE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can update haji registrations" ON public.haji_registrations;
CREATE POLICY "Agents can update haji registrations" ON public.haji_registrations FOR UPDATE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can create haji registrations" ON public.haji_registrations;
CREATE POLICY "Users can create haji registrations" ON public.haji_registrations FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own haji registrations" ON public.haji_registrations;
CREATE POLICY "Users can view own haji registrations" ON public.haji_registrations FOR SELECT TO public USING (((auth.uid() = user_id) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage hotels" ON public.hotels;
CREATE POLICY "Admins can manage hotels" ON public.hotels FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active hotels" ON public.hotels;
CREATE POLICY "Anyone can view active hotels" ON public.hotels FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage habits" ON public.ibadah_habits;
CREATE POLICY "Admins can manage habits" ON public.ibadah_habits FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active habits" ON public.ibadah_habits;
CREATE POLICY "Anyone can view active habits" ON public.ibadah_habits FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage locations" ON public.important_locations;
CREATE POLICY "Admins can manage locations" ON public.important_locations FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active locations" ON public.important_locations;
CREATE POLICY "Anyone can view active locations" ON public.important_locations FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can add photos to own journals" ON public.journal_photos;
CREATE POLICY "Users can add photos to own journals" ON public.journal_photos FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM journals j
  WHERE ((j.id = journal_photos.journal_id) AND (j.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users can delete photos from own journals" ON public.journal_photos;
CREATE POLICY "Users can delete photos from own journals" ON public.journal_photos FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM journals j
  WHERE ((j.id = journal_photos.journal_id) AND (j.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users can view photos of accessible journals" ON public.journal_photos;
CREATE POLICY "Users can view photos of accessible journals" ON public.journal_photos FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM journals j
  WHERE ((j.id = journal_photos.journal_id) AND ((j.user_id = auth.uid()) OR (j.is_public = true))))));
DROP POLICY IF EXISTS "Users can create own journals" ON public.journals;
CREATE POLICY "Users can create own journals" ON public.journals FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own journals" ON public.journals;
CREATE POLICY "Users can delete own journals" ON public.journals FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own journals" ON public.journals;
CREATE POLICY "Users can update own journals" ON public.journals FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own journals" ON public.journals;
CREATE POLICY "Users can view own journals" ON public.journals FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view public journals" ON public.journals;
CREATE POLICY "Users can view public journals" ON public.journals FOR SELECT TO public USING ((is_public = true));
DROP POLICY IF EXISTS "Admins can manage guides" ON public.manasik_guides;
CREATE POLICY "Admins can manage guides" ON public.manasik_guides FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active guides" ON public.manasik_guides;
CREATE POLICY "Anyone can view active guides" ON public.manasik_guides FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.memberships;
CREATE POLICY "Admins can manage all memberships" ON public.memberships FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Agents can request membership" ON public.memberships;
CREATE POLICY "Agents can request membership" ON public.memberships FOR INSERT TO public WITH CHECK ((owns_travel(auth.uid(), travel_id) AND (status = 'pending'::text)));
DROP POLICY IF EXISTS "Agents can view own membership" ON public.memberships;
CREATE POLICY "Agents can view own membership" ON public.memberships FOR SELECT TO public USING (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.order_notifications;
CREATE POLICY "Users can mark own notifications read" ON public.order_notifications FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own order notifications" ON public.order_notifications;
CREATE POLICY "Users can view own order notifications" ON public.order_notifications FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admin can view all order history" ON public.order_status_history;
CREATE POLICY "Admin can view all order history" ON public.order_status_history FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role)));
DROP POLICY IF EXISTS "Buyers can view own order history" ON public.order_status_history;
CREATE POLICY "Buyers can view own order history" ON public.order_status_history FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM shop_orders so
  WHERE ((so.id = order_status_history.order_id) AND (so.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Sellers can view order history for their products" ON public.order_status_history;
CREATE POLICY "Sellers can view order history for their products" ON public.order_status_history FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM ((shop_order_items soi
     JOIN shop_products sp ON ((soi.product_id = sp.id)))
     JOIN seller_profiles selp ON ((sp.seller_id = selp.id)))
  WHERE ((soi.order_id = order_status_history.order_id) AND (selp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Admins can manage all credits" ON public.package_credits;
CREATE POLICY "Admins can manage all credits" ON public.package_credits FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Agents can view own credits" ON public.package_credits;
CREATE POLICY "Agents can view own credits" ON public.package_credits FOR SELECT TO public USING (owns_travel(auth.uid(), travel_id));
DROP POLICY IF EXISTS "Agents can delete inquiries" ON public.package_inquiries;
CREATE POLICY "Agents can delete inquiries" ON public.package_inquiries FOR DELETE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can update inquiries" ON public.package_inquiries;
CREATE POLICY "Agents can update inquiries" ON public.package_inquiries FOR UPDATE TO public USING ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON public.package_inquiries;
CREATE POLICY "Authenticated users can create inquiries" ON public.package_inquiries FOR INSERT TO public WITH CHECK ((((auth.uid() IS NULL) AND (user_id IS NULL)) OR ((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.package_inquiries;
CREATE POLICY "Users can view own inquiries" ON public.package_inquiries FOR SELECT TO public USING ((((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)) OR owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can view own package interests" ON public.package_interests;
CREATE POLICY "Agents can view own package interests" ON public.package_interests FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM ((packages pkg
     JOIN travels t ON ((pkg.travel_id = t.id)))
     JOIN profiles p ON ((t.owner_id = p.id)))
  WHERE ((pkg.id = package_interests.package_id) AND (p.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can create valid interests" ON public.package_interests;
CREATE POLICY "Anyone can create valid interests" ON public.package_interests FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM packages p
  WHERE ((p.id = package_interests.package_id) AND (p.is_active = true)))));
DROP POLICY IF EXISTS "Agents can create packages" ON public.packages;
CREATE POLICY "Agents can create packages" ON public.packages FOR INSERT TO public WITH CHECK ((owns_travel(auth.uid(), travel_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages" ON public.packages FOR SELECT TO public USING ((((is_active = true) AND (EXISTS ( SELECT 1
   FROM travels t
  WHERE ((t.id = packages.travel_id) AND (t.status = 'active'::text) AND (t.verified = true))))) OR owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owners can delete packages" ON public.packages;
CREATE POLICY "Owners can delete packages" ON public.packages FOR DELETE TO public USING ((owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owners can update packages" ON public.packages;
CREATE POLICY "Owners can update packages" ON public.packages FOR UPDATE TO public USING ((owns_package(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage templates" ON public.packing_templates;
CREATE POLICY "Admins can manage templates" ON public.packing_templates FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.packing_templates;
CREATE POLICY "Anyone can view active templates" ON public.packing_templates FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage page versions" ON public.page_versions;
CREATE POLICY "Admins can manage page versions" ON public.page_versions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users and agents can create notification logs" ON public.payment_notification_logs;
CREATE POLICY "Users and agents can create notification logs" ON public.payment_notification_logs FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = payment_notification_logs.booking_id) AND (owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role)))))));
DROP POLICY IF EXISTS "Users can update own notification logs" ON public.payment_notification_logs;
CREATE POLICY "Users can update own notification logs" ON public.payment_notification_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own notification logs" ON public.payment_notification_logs;
CREATE POLICY "Users can view own notification logs" ON public.payment_notification_logs FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Agents can manage payment schedules" ON public.payment_schedules;
CREATE POLICY "Agents can manage payment schedules" ON public.payment_schedules FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = payment_schedules.booking_id) AND (owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role))))));
DROP POLICY IF EXISTS "Users can view own payment schedules" ON public.payment_schedules;
CREATE POLICY "Users can view own payment schedules" ON public.payment_schedules FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM bookings b
  WHERE ((b.id = payment_schedules.booking_id) AND ((b.user_id = auth.uid()) OR owns_travel(auth.uid(), b.travel_id) OR has_role(auth.uid(), 'admin'::app_role))))));
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Anyone can view settings" ON public.platform_settings;
CREATE POLICY "Anyone can view settings" ON public.platform_settings FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage categories" ON public.prayer_categories;
CREATE POLICY "Admins can manage categories" ON public.prayer_categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.prayer_categories;
CREATE POLICY "Anyone can view active categories" ON public.prayer_categories FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage prayers" ON public.prayers;
CREATE POLICY "Admins can manage prayers" ON public.prayers FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active prayers" ON public.prayers;
CREATE POLICY "Anyone can view active prayers" ON public.prayers FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view reviews" ON public.product_reviews FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can create own reviews" ON public.product_reviews;
CREATE POLICY "Users can create own reviews" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM shop_orders
  WHERE ((shop_orders.id = product_reviews.order_id) AND (shop_orders.user_id = auth.uid()) AND (shop_orders.status = 'delivered'::shop_order_status))))));
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews" ON public.product_reviews FOR DELETE TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own reviews" ON public.product_reviews FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can add to wishlist" ON public.product_wishlist;
CREATE POLICY "Users can add to wishlist" ON public.product_wishlist FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can remove from wishlist" ON public.product_wishlist;
CREATE POLICY "Users can remove from wishlist" ON public.product_wishlist FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.product_wishlist;
CREATE POLICY "Users can view own wishlist" ON public.product_wishlist FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can delete quran ayahs" ON public.quran_ayahs;
CREATE POLICY "Admins can delete quran ayahs" ON public.quran_ayahs FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can insert quran ayahs" ON public.quran_ayahs;
CREATE POLICY "Admins can insert quran ayahs" ON public.quran_ayahs FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update quran ayahs" ON public.quran_ayahs;
CREATE POLICY "Admins can update quran ayahs" ON public.quran_ayahs FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can read quran ayahs" ON public.quran_ayahs;
CREATE POLICY "Anyone can read quran ayahs" ON public.quran_ayahs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users manage own khatam targets" ON public.quran_khatam_targets;
CREATE POLICY "Users manage own khatam targets" ON public.quran_khatam_targets FOR ALL TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can insert own last read" ON public.quran_last_read;
CREATE POLICY "Users can insert own last read" ON public.quran_last_read FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own last read" ON public.quran_last_read;
CREATE POLICY "Users can update own last read" ON public.quran_last_read FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own last read" ON public.quran_last_read;
CREATE POLICY "Users can view own last read" ON public.quran_last_read FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage surahs" ON public.quran_surahs;
CREATE POLICY "Admins can manage surahs" ON public.quran_surahs FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view surahs" ON public.quran_surahs;
CREATE POLICY "Anyone can view surahs" ON public.quran_surahs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can insert sync logs" ON public.quran_sync_logs;
CREATE POLICY "Admins can insert sync logs" ON public.quran_sync_logs FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update sync logs" ON public.quran_sync_logs;
CREATE POLICY "Admins can update sync logs" ON public.quran_sync_logs FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can read sync logs" ON public.quran_sync_logs;
CREATE POLICY "Anyone can read sync logs" ON public.quran_sync_logs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can delete own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can delete own logs" ON public.quran_tadarus_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can insert own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can insert own logs" ON public.quran_tadarus_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own logs" ON public.quran_tadarus_logs;
CREATE POLICY "Users can view own logs" ON public.quran_tadarus_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage tips" ON public.quran_tips;
CREATE POLICY "Admins can manage tips" ON public.quran_tips FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Tips readable by all authenticated" ON public.quran_tips;
CREATE POLICY "Tips readable by all authenticated" ON public.quran_tips FOR SELECT TO authenticated USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage sedekah types" ON public.sedekah_types;
CREATE POLICY "Admins can manage sedekah types" ON public.sedekah_types FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active sedekah types" ON public.sedekah_types;
CREATE POLICY "Anyone can view active sedekah types" ON public.sedekah_types FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.seller_applications;
CREATE POLICY "Admins can manage all applications" ON public.seller_applications FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create own application" ON public.seller_applications;
CREATE POLICY "Users can create own application" ON public.seller_applications FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own application" ON public.seller_applications;
CREATE POLICY "Users can view own application" ON public.seller_applications FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.seller_credit_transactions;
CREATE POLICY "Admins can manage all transactions" ON public.seller_credit_transactions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Sellers can view own transactions" ON public.seller_credit_transactions;
CREATE POLICY "Sellers can view own transactions" ON public.seller_credit_transactions FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = seller_credit_transactions.seller_id) AND (sp.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all credits" ON public.seller_credits;
CREATE POLICY "Admins can manage all credits" ON public.seller_credits FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Sellers can view own credits" ON public.seller_credits;
CREATE POLICY "Sellers can view own credits" ON public.seller_credits FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = seller_credits.seller_id) AND (sp.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all featured" ON public.seller_featured_products;
CREATE POLICY "Admins can manage all featured" ON public.seller_featured_products FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active featured" ON public.seller_featured_products;
CREATE POLICY "Anyone can view active featured" ON public.seller_featured_products FOR SELECT TO public USING (((status = 'active'::text) AND (start_date <= now()) AND (end_date >= now())));
DROP POLICY IF EXISTS "Sellers can manage own featured" ON public.seller_featured_products;
CREATE POLICY "Sellers can manage own featured" ON public.seller_featured_products FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = seller_featured_products.seller_id) AND (sp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Admins can manage plans" ON public.seller_membership_plans;
CREATE POLICY "Admins can manage plans" ON public.seller_membership_plans FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.seller_membership_plans;
CREATE POLICY "Anyone can view active plans" ON public.seller_membership_plans FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.seller_memberships;
CREATE POLICY "Admins can manage all memberships" ON public.seller_memberships FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Sellers can create own membership" ON public.seller_memberships;
CREATE POLICY "Sellers can create own membership" ON public.seller_memberships FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = seller_memberships.seller_id) AND (sp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Sellers can view own membership" ON public.seller_memberships;
CREATE POLICY "Sellers can view own membership" ON public.seller_memberships FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = seller_memberships.seller_id) AND (sp.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all seller profiles" ON public.seller_profiles;
CREATE POLICY "Admins can manage all seller profiles" ON public.seller_profiles FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active sellers" ON public.seller_profiles;
CREATE POLICY "Anyone can view active sellers" ON public.seller_profiles FOR SELECT TO public USING (((is_active = true) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.seller_profiles;
CREATE POLICY "Users can insert own seller profile" ON public.seller_profiles FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own seller profile" ON public.seller_profiles;
CREATE POLICY "Users can update own seller profile" ON public.seller_profiles FOR UPDATE TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.seller_reviews;
CREATE POLICY "Admins can manage all reviews" ON public.seller_reviews FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.seller_reviews;
CREATE POLICY "Anyone can view published reviews" ON public.seller_reviews FOR SELECT TO public USING (((is_published = true) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can create reviews" ON public.seller_reviews;
CREATE POLICY "Users can create reviews" ON public.seller_reviews FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.seller_reviews;
CREATE POLICY "Users can delete own reviews" ON public.seller_reviews FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own reviews" ON public.seller_reviews;
CREATE POLICY "Users can update own reviews" ON public.seller_reviews FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users manage own cart items" ON public.shop_cart_items;
CREATE POLICY "Users manage own cart items" ON public.shop_cart_items FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM shop_carts
  WHERE ((shop_carts.id = shop_cart_items.cart_id) AND (shop_carts.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM shop_carts
  WHERE ((shop_carts.id = shop_cart_items.cart_id) AND (shop_carts.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users manage own cart" ON public.shop_carts;
CREATE POLICY "Users manage own cart" ON public.shop_carts FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admin/shop_admin manage categories" ON public.shop_categories;
CREATE POLICY "Admin/shop_admin manage categories" ON public.shop_categories FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.shop_categories;
CREATE POLICY "Anyone can view active categories" ON public.shop_categories FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Users can read own chat messages" ON public.shop_chat_messages;
CREATE POLICY "Users can read own chat messages" ON public.shop_chat_messages FOR SELECT TO authenticated USING (((sender_id = auth.uid()) OR ((order_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM shop_orders
  WHERE ((shop_orders.id = shop_chat_messages.order_id) AND (shop_orders.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM seller_profiles
  WHERE ((seller_profiles.id = shop_chat_messages.seller_id) AND (seller_profiles.user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Users can send chat messages" ON public.shop_chat_messages;
CREATE POLICY "Users can send chat messages" ON public.shop_chat_messages FOR INSERT TO authenticated WITH CHECK ((sender_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own received messages" ON public.shop_chat_messages;
CREATE POLICY "Users can update own received messages" ON public.shop_chat_messages FOR UPDATE TO authenticated USING (((sender_id <> auth.uid()) AND (((order_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM shop_orders
  WHERE ((shop_orders.id = shop_chat_messages.order_id) AND (shop_orders.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM seller_profiles
  WHERE ((seller_profiles.id = shop_chat_messages.seller_id) AND (seller_profiles.user_id = auth.uid())))))));
DROP POLICY IF EXISTS "Sellers can view own product order items" ON public.shop_order_items;
CREATE POLICY "Sellers can view own product order items" ON public.shop_order_items FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (shop_products sp
     JOIN seller_profiles selp ON ((sp.seller_id = selp.id)))
  WHERE ((sp.id = shop_order_items.product_id) AND (selp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users create order items" ON public.shop_order_items;
CREATE POLICY "Users create order items" ON public.shop_order_items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM shop_orders
  WHERE ((shop_orders.id = shop_order_items.order_id) AND (shop_orders.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users view own order items" ON public.shop_order_items;
CREATE POLICY "Users view own order items" ON public.shop_order_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM shop_orders
  WHERE ((shop_orders.id = shop_order_items.order_id) AND ((shop_orders.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role))))));
DROP POLICY IF EXISTS "Admin/shop_admin update orders" ON public.shop_orders;
CREATE POLICY "Admin/shop_admin update orders" ON public.shop_orders FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role)));
DROP POLICY IF EXISTS "Sellers can update orders for their products" ON public.shop_orders;
CREATE POLICY "Sellers can update orders for their products" ON public.shop_orders FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((shop_order_items soi
     JOIN shop_products sp ON ((soi.product_id = sp.id)))
     JOIN seller_profiles selp ON ((sp.seller_id = selp.id)))
  WHERE ((soi.order_id = shop_orders.id) AND (selp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.shop_orders;
CREATE POLICY "Sellers can view orders for their products" ON public.shop_orders FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM ((shop_order_items soi
     JOIN shop_products sp ON ((soi.product_id = sp.id)))
     JOIN seller_profiles selp ON ((sp.seller_id = selp.id)))
  WHERE ((soi.order_id = shop_orders.id) AND (selp.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users create own orders" ON public.shop_orders;
CREATE POLICY "Users create own orders" ON public.shop_orders FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Users view own orders" ON public.shop_orders;
CREATE POLICY "Users view own orders" ON public.shop_orders FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role)));
DROP POLICY IF EXISTS "Admin/shop_admin manage products" ON public.shop_products;
CREATE POLICY "Admin/shop_admin manage products" ON public.shop_products FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view active products" ON public.shop_products;
CREATE POLICY "Anyone can view active products" ON public.shop_products FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Sellers can manage own products" ON public.shop_products;
CREATE POLICY "Sellers can manage own products" ON public.shop_products FOR ALL TO public USING (((seller_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM seller_profiles sp
  WHERE ((sp.id = shop_products.seller_id) AND (sp.user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Admins can manage pages" ON public.static_pages;
CREATE POLICY "Admins can manage pages" ON public.static_pages FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active pages" ON public.static_pages;
CREATE POLICY "Anyone can view active pages" ON public.static_pages FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Creators can delete their groups" ON public.tracking_groups;
CREATE POLICY "Creators can delete their groups" ON public.tracking_groups FOR DELETE TO public USING ((created_by = auth.uid()));
DROP POLICY IF EXISTS "Creators can update their groups" ON public.tracking_groups;
CREATE POLICY "Creators can update their groups" ON public.tracking_groups FOR UPDATE TO public USING ((created_by = auth.uid()));
DROP POLICY IF EXISTS "Users can create groups" ON public.tracking_groups;
CREATE POLICY "Users can create groups" ON public.tracking_groups FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON public.tracking_groups;
CREATE POLICY "Users can view groups they created or are members of" ON public.tracking_groups FOR SELECT TO public USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM group_locations gl
  WHERE ((gl.group_id = gl.id) AND (gl.user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.travel_reviews;
CREATE POLICY "Admins can manage all reviews" ON public.travel_reviews FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.travel_reviews;
CREATE POLICY "Anyone can view published reviews" ON public.travel_reviews FOR SELECT TO public USING (((is_published = true) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can create reviews" ON public.travel_reviews;
CREATE POLICY "Users can create reviews" ON public.travel_reviews FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.travel_reviews;
CREATE POLICY "Users can delete own reviews" ON public.travel_reviews FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own reviews" ON public.travel_reviews;
CREATE POLICY "Users can update own reviews" ON public.travel_reviews FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Agents and admins can create travel" ON public.travels;
CREATE POLICY "Agents and admins can create travel" ON public.travels FOR INSERT TO authenticated WITH CHECK (((has_role(auth.uid(), 'agent'::app_role) AND (owner_id = get_profile_id(auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view travels" ON public.travels;
CREATE POLICY "Anyone can view travels" ON public.travels FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Owners can delete travel" ON public.travels;
CREATE POLICY "Owners can delete travel" ON public.travels FOR DELETE TO public USING ((owns_travel(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owners can update travel" ON public.travels;
CREATE POLICY "Owners can update travel" ON public.travels FOR UPDATE TO public USING ((owns_travel(auth.uid(), id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users manage own achievements" ON public.user_achievements;
CREATE POLICY "Users manage own achievements" ON public.user_achievements FOR ALL TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own checklist progress" ON public.user_checklists;
CREATE POLICY "Users can create own checklist progress" ON public.user_checklists FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own checklist progress" ON public.user_checklists;
CREATE POLICY "Users can delete own checklist progress" ON public.user_checklists FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own checklist progress" ON public.user_checklists;
CREATE POLICY "Users can update own checklist progress" ON public.user_checklists FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own checklist progress" ON public.user_checklists;
CREATE POLICY "Users can view own checklist progress" ON public.user_checklists FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can manage own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can manage own custom habits" ON public.user_custom_habits FOR ALL TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own custom habits" ON public.user_custom_habits;
CREATE POLICY "Users can view own custom habits" ON public.user_custom_habits FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own dzikir logs" ON public.user_dzikir_logs;
CREATE POLICY "Users can create own dzikir logs" ON public.user_dzikir_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own dzikir logs" ON public.user_dzikir_logs;
CREATE POLICY "Users can delete own dzikir logs" ON public.user_dzikir_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own dzikir logs" ON public.user_dzikir_logs;
CREATE POLICY "Users can update own dzikir logs" ON public.user_dzikir_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own dzikir logs" ON public.user_dzikir_logs;
CREATE POLICY "Users can view own dzikir logs" ON public.user_dzikir_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own exercise logs" ON public.user_exercise_logs;
CREATE POLICY "Users can create own exercise logs" ON public.user_exercise_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own exercise logs" ON public.user_exercise_logs;
CREATE POLICY "Users can delete own exercise logs" ON public.user_exercise_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own exercise logs" ON public.user_exercise_logs;
CREATE POLICY "Users can view own exercise logs" ON public.user_exercise_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own logs" ON public.user_ibadah_logs;
CREATE POLICY "Users can create own logs" ON public.user_ibadah_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own logs" ON public.user_ibadah_logs;
CREATE POLICY "Users can delete own logs" ON public.user_ibadah_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own logs" ON public.user_ibadah_logs;
CREATE POLICY "Users can update own logs" ON public.user_ibadah_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own logs" ON public.user_ibadah_logs;
CREATE POLICY "Users can view own logs" ON public.user_ibadah_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.user_ibadah_streaks;
CREATE POLICY "Users can manage own streaks" ON public.user_ibadah_streaks FOR ALL TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own streaks" ON public.user_ibadah_streaks;
CREATE POLICY "Users can view own streaks" ON public.user_ibadah_streaks FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own meal logs" ON public.user_meal_logs;
CREATE POLICY "Users can create own meal logs" ON public.user_meal_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own meal logs" ON public.user_meal_logs;
CREATE POLICY "Users can delete own meal logs" ON public.user_meal_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own meal logs" ON public.user_meal_logs;
CREATE POLICY "Users can update own meal logs" ON public.user_meal_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own meal logs" ON public.user_meal_logs;
CREATE POLICY "Users can view own meal logs" ON public.user_meal_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can create own logs" ON public.user_quran_logs;
CREATE POLICY "Users can create own logs" ON public.user_quran_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own logs" ON public.user_quran_logs;
CREATE POLICY "Users can delete own logs" ON public.user_quran_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own logs" ON public.user_quran_logs;
CREATE POLICY "Users can update own logs" ON public.user_quran_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own logs" ON public.user_quran_logs;
CREATE POLICY "Users can view own logs" ON public.user_quran_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can manage own ramadan settings" ON public.user_ramadan_settings;
CREATE POLICY "Users can manage own ramadan settings" ON public.user_ramadan_settings FOR ALL TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own ramadan settings" ON public.user_ramadan_settings;
CREATE POLICY "Users can view own ramadan settings" ON public.user_ramadan_settings FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can request agent role" ON public.user_roles;
CREATE POLICY "Users can request agent role" ON public.user_roles FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) AND (role = 'agent'::app_role)));
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Users can create own sedekah logs" ON public.user_sedekah_logs;
CREATE POLICY "Users can create own sedekah logs" ON public.user_sedekah_logs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete own sedekah logs" ON public.user_sedekah_logs;
CREATE POLICY "Users can delete own sedekah logs" ON public.user_sedekah_logs FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own sedekah logs" ON public.user_sedekah_logs;
CREATE POLICY "Users can update own sedekah logs" ON public.user_sedekah_logs FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own sedekah logs" ON public.user_sedekah_logs;
CREATE POLICY "Users can view own sedekah logs" ON public.user_sedekah_logs FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can create own subscription" ON public.user_subscriptions FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) AND (status = 'pending'::text)));
DROP POLICY IF EXISTS "Users can update own pending subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update own pending subscription" ON public.user_subscriptions FOR UPDATE TO public USING (((auth.uid() = user_id) AND (status = 'pending'::text)));
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT TO public USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can manage templates" ON public.website_templates;
CREATE POLICY "Admins can manage templates" ON public.website_templates FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.website_templates;
CREATE POLICY "Anyone can view active templates" ON public.website_templates FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));

-- ==========================================
-- TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS update_agent_applications_updated_at ON public.agent_applications;
CREATE TRIGGER update_agent_applications_updated_at BEFORE UPDATE ON public.agent_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_agent_website_settings_updated_at ON public.agent_website_settings;
CREATE TRIGGER update_agent_website_settings_updated_at BEFORE UPDATE ON public.agent_website_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_airlines_updated_at ON public.airlines;
CREATE TRIGGER update_airlines_updated_at BEFORE UPDATE ON public.airlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_set_booking_code ON public.bookings;
CREATE TRIGGER trigger_set_booking_code BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_code();
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_checklists_updated_at ON public.checklists;
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_content_ratings_updated_at ON public.content_ratings;
CREATE TRIGGER update_content_ratings_updated_at BEFORE UPDATE ON public.content_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_departures_updated_at ON public.departures;
CREATE TRIGGER update_departures_updated_at BEFORE UPDATE ON public.departures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_dzikir_types_updated_at ON public.dzikir_types;
CREATE TRIGGER update_dzikir_types_updated_at BEFORE UPDATE ON public.dzikir_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_exercise_types_updated_at ON public.exercise_types;
CREATE TRIGGER update_exercise_types_updated_at BEFORE UPDATE ON public.exercise_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_featured_packages_updated_at ON public.featured_packages;
CREATE TRIGGER update_featured_packages_updated_at BEFORE UPDATE ON public.featured_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON public.feedbacks;
CREATE TRIGGER update_feedbacks_updated_at BEFORE UPDATE ON public.feedbacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_haji_registrations_updated_at ON public.haji_registrations;
CREATE TRIGGER update_haji_registrations_updated_at BEFORE UPDATE ON public.haji_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_hotels_updated_at ON public.hotels;
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_ibadah_habits_updated_at ON public.ibadah_habits;
CREATE TRIGGER update_ibadah_habits_updated_at BEFORE UPDATE ON public.ibadah_habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_journals_updated_at ON public.journals;
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.memberships;
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_package_credits_updated_at ON public.package_credits;
CREATE TRIGGER update_package_credits_updated_at BEFORE UPDATE ON public.package_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_package_inquiries_updated_at ON public.package_inquiries;
CREATE TRIGGER update_package_inquiries_updated_at BEFORE UPDATE ON public.package_inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_booking_paid ON public.payment_schedules;
CREATE TRIGGER trigger_update_booking_paid AFTER INSERT OR UPDATE OR DELETE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION public.update_booking_paid_amount();
DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON public.payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_prayer_categories_updated_at ON public.prayer_categories;
CREATE TRIGGER update_prayer_categories_updated_at BEFORE UPDATE ON public.prayer_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_prayers_updated_at ON public.prayers;
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_quran_ayahs_updated_at ON public.quran_ayahs;
CREATE TRIGGER update_quran_ayahs_updated_at BEFORE UPDATE ON public.quran_ayahs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_sedekah_types_updated_at ON public.sedekah_types;
CREATE TRIGGER update_sedekah_types_updated_at BEFORE UPDATE ON public.sedekah_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_applications_updated_at ON public.seller_applications;
CREATE TRIGGER update_seller_applications_updated_at BEFORE UPDATE ON public.seller_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_credits_updated_at ON public.seller_credits;
CREATE TRIGGER update_seller_credits_updated_at BEFORE UPDATE ON public.seller_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_featured_updated_at ON public.seller_featured_products;
CREATE TRIGGER update_seller_featured_updated_at BEFORE UPDATE ON public.seller_featured_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_memberships_updated_at ON public.seller_memberships;
CREATE TRIGGER update_seller_memberships_updated_at BEFORE UPDATE ON public.seller_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_profiles_updated_at ON public.seller_profiles;
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_seller_rating_trigger ON public.seller_reviews;
CREATE TRIGGER update_seller_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON public.seller_reviews FOR EACH ROW EXECUTE FUNCTION public.update_seller_rating();
DROP TRIGGER IF EXISTS update_shop_carts_updated_at ON public.shop_carts;
CREATE TRIGGER update_shop_carts_updated_at BEFORE UPDATE ON public.shop_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_shop_categories_updated_at ON public.shop_categories;
CREATE TRIGGER update_shop_categories_updated_at BEFORE UPDATE ON public.shop_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS on_new_chat_message ON public.shop_chat_messages;
CREATE TRIGGER on_new_chat_message AFTER INSERT ON public.shop_chat_messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_chat_message();
DROP TRIGGER IF EXISTS set_shop_order_code_trigger ON public.shop_orders;
CREATE TRIGGER set_shop_order_code_trigger BEFORE INSERT ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.set_shop_order_code();
DROP TRIGGER IF EXISTS trg_new_order_notify ON public.shop_orders;
CREATE TRIGGER trg_new_order_notify AFTER INSERT ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();
DROP TRIGGER IF EXISTS trg_order_status_notify ON public.shop_orders;
CREATE TRIGGER trg_order_status_notify AFTER UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();
DROP TRIGGER IF EXISTS trg_record_order_status_change ON public.shop_orders;
CREATE TRIGGER trg_record_order_status_change AFTER UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.record_order_status_change();
DROP TRIGGER IF EXISTS update_shop_orders_updated_at ON public.shop_orders;
CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_shop_stock_trigger ON public.shop_orders;
CREATE TRIGGER update_shop_stock_trigger AFTER UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.update_shop_stock();
DROP TRIGGER IF EXISTS update_shop_products_updated_at ON public.shop_products;
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_static_pages_updated_at ON public.static_pages;
CREATE TRIGGER update_static_pages_updated_at BEFORE UPDATE ON public.static_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_tracking_group_code ON public.tracking_groups;
CREATE TRIGGER set_tracking_group_code BEFORE INSERT ON public.tracking_groups FOR EACH ROW EXECUTE FUNCTION public.set_group_code();
DROP TRIGGER IF EXISTS update_travel_rating_on_delete ON public.travel_reviews;
CREATE TRIGGER update_travel_rating_on_delete AFTER DELETE ON public.travel_reviews FOR EACH ROW EXECUTE FUNCTION public.update_travel_rating();
DROP TRIGGER IF EXISTS update_travel_rating_on_insert ON public.travel_reviews;
CREATE TRIGGER update_travel_rating_on_insert AFTER INSERT ON public.travel_reviews FOR EACH ROW EXECUTE FUNCTION public.update_travel_rating();
DROP TRIGGER IF EXISTS update_travel_rating_on_update ON public.travel_reviews;
CREATE TRIGGER update_travel_rating_on_update AFTER UPDATE ON public.travel_reviews FOR EACH ROW EXECUTE FUNCTION public.update_travel_rating();
DROP TRIGGER IF EXISTS update_travel_reviews_updated_at ON public.travel_reviews;
CREATE TRIGGER update_travel_reviews_updated_at BEFORE UPDATE ON public.travel_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_travels_updated_at ON public.travels;
CREATE TRIGGER update_travels_updated_at BEFORE UPDATE ON public.travels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_checklists_updated_at ON public.user_checklists;
CREATE TRIGGER update_user_checklists_updated_at BEFORE UPDATE ON public.user_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_custom_habits_updated_at ON public.user_custom_habits;
CREATE TRIGGER update_user_custom_habits_updated_at BEFORE UPDATE ON public.user_custom_habits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_dzikir_logs_updated_at ON public.user_dzikir_logs;
CREATE TRIGGER update_user_dzikir_logs_updated_at BEFORE UPDATE ON public.user_dzikir_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_ibadah_logs_updated_at ON public.user_ibadah_logs;
CREATE TRIGGER update_user_ibadah_logs_updated_at BEFORE UPDATE ON public.user_ibadah_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_ibadah_streaks_updated_at ON public.user_ibadah_streaks;
CREATE TRIGGER update_user_ibadah_streaks_updated_at BEFORE UPDATE ON public.user_ibadah_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_meal_logs_updated_at ON public.user_meal_logs;
CREATE TRIGGER update_user_meal_logs_updated_at BEFORE UPDATE ON public.user_meal_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_quran_logs_updated_at ON public.user_quran_logs;
CREATE TRIGGER update_user_quran_logs_updated_at BEFORE UPDATE ON public.user_quran_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_ramadan_settings_updated_at ON public.user_ramadan_settings;
CREATE TRIGGER update_user_ramadan_settings_updated_at BEFORE UPDATE ON public.user_ramadan_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_sedekah_logs_updated_at ON public.user_sedekah_logs;
CREATE TRIGGER update_user_sedekah_logs_updated_at BEFORE UPDATE ON public.user_sedekah_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.package_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('haji-documents', 'haji-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('package-images', 'package-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('prayer-audio', 'prayer-audio', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-logos', 'travel-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STORAGE POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Admin delete shop-images" ON storage.objects;
CREATE POLICY "Admin delete shop-images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'shop-images'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role))));
DROP POLICY IF EXISTS "Admin update shop-images" ON storage.objects;
CREATE POLICY "Admin update shop-images" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'shop-images'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role))));
DROP POLICY IF EXISTS "Admin upload shop-images" ON storage.objects;
CREATE POLICY "Admin upload shop-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'shop-images'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'shop_admin'::app_role))));
DROP POLICY IF EXISTS "Admins can delete prayer audio" ON storage.objects;
CREATE POLICY "Admins can delete prayer audio" ON storage.objects FOR DELETE TO public USING (((bucket_id = 'prayer-audio'::text) AND has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can update prayer audio" ON storage.objects;
CREATE POLICY "Admins can update prayer audio" ON storage.objects FOR UPDATE TO public USING (((bucket_id = 'prayer-audio'::text) AND has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Admins can upload prayer audio" ON storage.objects;
CREATE POLICY "Admins can upload prayer audio" ON storage.objects FOR INSERT TO public WITH CHECK (((bucket_id = 'prayer-audio'::text) AND has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Anyone can view journal photos" ON storage.objects;
CREATE POLICY "Anyone can view journal photos" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'journal-photos'::text));
DROP POLICY IF EXISTS "Anyone can view prayer audio" ON storage.objects;
CREATE POLICY "Anyone can view prayer audio" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'prayer-audio'::text));
DROP POLICY IF EXISTS "Anyone can view travel logos" ON storage.objects;
CREATE POLICY "Anyone can view travel logos" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'travel-logos'::text));
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'uploads'::text));
DROP POLICY IF EXISTS "Authenticated users can upload journal photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload journal photos" ON storage.objects FOR INSERT TO public WITH CHECK (((bucket_id = 'journal-photos'::text) AND (auth.role() = 'authenticated'::text)));
DROP POLICY IF EXISTS "Authenticated users can upload package images" ON storage.objects;
CREATE POLICY "Authenticated users can upload package images" ON storage.objects FOR INSERT TO public WITH CHECK (((bucket_id = 'package-images'::text) AND (auth.role() = 'authenticated'::text)));
DROP POLICY IF EXISTS "Authenticated users can upload travel logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload travel logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'travel-logos'::text));
DROP POLICY IF EXISTS "Owners can delete travel logos" ON storage.objects;
CREATE POLICY "Owners can delete travel logos" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'travel-logos'::text));
DROP POLICY IF EXISTS "Owners can update travel logos" ON storage.objects;
CREATE POLICY "Owners can update travel logos" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'travel-logos'::text));
DROP POLICY IF EXISTS "Package images are publicly accessible" ON storage.objects;
CREATE POLICY "Package images are publicly accessible" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'package-images'::text));
DROP POLICY IF EXISTS "Public can view uploads" ON storage.objects;
CREATE POLICY "Public can view uploads" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'uploads'::text));
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
CREATE POLICY "Public read shop-images" ON storage.objects FOR SELECT TO public USING ((bucket_id = 'shop-images'::text));
DROP POLICY IF EXISTS "Users can delete own haji documents" ON storage.objects;
CREATE POLICY "Users can delete own haji documents" ON storage.objects FOR DELETE TO public USING (((bucket_id = 'haji-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS "Users can delete own journal photos" ON storage.objects;
CREATE POLICY "Users can delete own journal photos" ON storage.objects FOR DELETE TO public USING (((bucket_id = 'journal-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS "Users can delete own package images" ON storage.objects;
CREATE POLICY "Users can delete own package images" ON storage.objects FOR DELETE TO public USING (((bucket_id = 'package-images'::text) AND (auth.role() = 'authenticated'::text)));
DROP POLICY IF EXISTS "Users can update own journal photos" ON storage.objects;
CREATE POLICY "Users can update own journal photos" ON storage.objects FOR UPDATE TO public USING (((bucket_id = 'journal-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS "Users can update own package images" ON storage.objects;
CREATE POLICY "Users can update own package images" ON storage.objects FOR UPDATE TO public USING (((bucket_id = 'package-images'::text) AND (auth.role() = 'authenticated'::text)));
DROP POLICY IF EXISTS "Users can upload own haji documents" ON storage.objects;
CREATE POLICY "Users can upload own haji documents" ON storage.objects FOR INSERT TO public WITH CHECK (((bucket_id = 'haji-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS "Users can view own haji documents" ON storage.objects;
CREATE POLICY "Users can view own haji documents" ON storage.objects FOR SELECT TO public USING (((bucket_id = 'haji-documents'::text) AND (((auth.uid())::text = (storage.foldername(name))[1]) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))));

-- ==========================================
-- AUTH TRIGGER (new user → profile + role)
-- ==========================================
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
