-- =============================================
-- ARAH UMROH MARKETPLACE - DATABASE SCHEMA
-- =============================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('jamaah', 'agent', 'admin');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'jamaah',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create travels table (travel agency)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES public.travels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 9,
  hotel_makkah TEXT,
  hotel_madinah TEXT,
  hotel_star INTEGER DEFAULT 4 CHECK (hotel_star >= 1 AND hotel_star <= 5),
  airline TEXT,
  flight_type TEXT DEFAULT 'direct' CHECK (flight_type IN ('direct', 'transit')),
  meal_type TEXT DEFAULT 'fullboard' CHECK (meal_type IN ('fullboard', 'halfboard', 'breakfast')),
  facilities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create departures table (1 package -> many departures)
CREATE TABLE public.departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  price BIGINT NOT NULL,
  original_price BIGINT,
  available_seats INTEGER NOT NULL DEFAULT 45,
  total_seats INTEGER NOT NULL DEFAULT 45,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'limited', 'full', 'waitlist', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create user_roles table for role checking (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Function to check if user has a specific role
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

-- Function to check if user owns a travel agency
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

-- Function to check if user owns a package (via travel)
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

-- Function to check if user owns a departure (via package -> travel)
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

-- Function to get profile id from user id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - USER ROLES
-- =============================================

-- Only admins can view all roles, users can see their own
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - TRAVELS
-- =============================================

-- Everyone can view verified travels
CREATE POLICY "Anyone can view travels"
ON public.travels FOR SELECT
USING (true);

-- Agents can create their own travel
CREATE POLICY "Agents can create travel"
ON public.travels FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'agent') AND 
  owner_id = public.get_profile_id(auth.uid())
);

-- Owners can update their travel
CREATE POLICY "Owners can update travel"
ON public.travels FOR UPDATE
USING (public.owns_travel(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- Owners can delete their travel
CREATE POLICY "Owners can delete travel"
ON public.travels FOR DELETE
USING (public.owns_travel(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - PACKAGES
-- =============================================

-- Everyone can view active packages
CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (is_active = true OR public.owns_package(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- Agents can create packages for their travel
CREATE POLICY "Agents can create packages"
ON public.packages FOR INSERT
WITH CHECK (public.owns_travel(auth.uid(), travel_id) OR public.has_role(auth.uid(), 'admin'));

-- Owners can update their packages
CREATE POLICY "Owners can update packages"
ON public.packages FOR UPDATE
USING (public.owns_package(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- Owners can delete their packages
CREATE POLICY "Owners can delete packages"
ON public.packages FOR DELETE
USING (public.owns_package(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - DEPARTURES
-- =============================================

-- Everyone can view departures of active packages
CREATE POLICY "Anyone can view departures"
ON public.departures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.packages 
    WHERE id = package_id AND is_active = true
  ) OR 
  public.owns_departure(auth.uid(), id) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Agents can create departures for their packages
CREATE POLICY "Agents can create departures"
ON public.departures FOR INSERT
WITH CHECK (public.owns_package(auth.uid(), package_id) OR public.has_role(auth.uid(), 'admin'));

-- Owners can update their departures
CREATE POLICY "Owners can update departures"
ON public.departures FOR UPDATE
USING (public.owns_departure(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- Owners can delete their departures
CREATE POLICY "Owners can delete departures"
ON public.departures FOR DELETE
USING (public.owns_departure(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travels_updated_at
BEFORE UPDATE ON public.travels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departures_updated_at
BEFORE UPDATE ON public.departures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_travels_owner_id ON public.travels(owner_id);
CREATE INDEX idx_packages_travel_id ON public.packages(travel_id);
CREATE INDEX idx_packages_is_active ON public.packages(is_active);
CREATE INDEX idx_departures_package_id ON public.departures(package_id);
CREATE INDEX idx_departures_departure_date ON public.departures(departure_date);
CREATE INDEX idx_departures_status ON public.departures(status);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);