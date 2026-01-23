-- Create featured_packages table
CREATE TABLE public.featured_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'home', -- 'home', 'category', 'search'
  priority INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_featured_packages_active ON public.featured_packages(status, end_date) WHERE status = 'active';
CREATE INDEX idx_featured_packages_position ON public.featured_packages(position, priority DESC);

-- Enable RLS
ALTER TABLE public.featured_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active featured packages"
ON public.featured_packages
FOR SELECT
USING (status = 'active' AND end_date >= now());

CREATE POLICY "Agents can view own featured packages"
ON public.featured_packages
FOR SELECT
USING (owns_travel(auth.uid(), travel_id));

CREATE POLICY "Agents can create featured packages"
ON public.featured_packages
FOR INSERT
WITH CHECK (owns_travel(auth.uid(), travel_id));

CREATE POLICY "Admins can manage all featured packages"
ON public.featured_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_featured_packages_updated_at
BEFORE UPDATE ON public.featured_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default featured package settings
INSERT INTO public.platform_settings (key, value, description) VALUES
('featured_package_pricing', '{"daily_credits": 5, "weekly_credits": 25, "monthly_credits": 80, "positions": {"home": 1.5, "category": 1.0, "search": 1.2}}', 'Pricing for featured packages in credits'),
('featured_package_limits', '{"max_per_travel": 3, "max_home_total": 6, "max_category_total": 10}', 'Limits for featured packages')
ON CONFLICT (key) DO NOTHING;