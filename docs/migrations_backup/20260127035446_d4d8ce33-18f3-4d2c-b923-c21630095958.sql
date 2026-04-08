-- Create feedback types enum
CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion', 'rating', 'other');

-- Create feedback table
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type feedback_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
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

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create feedback"
ON public.feedbacks
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own feedback"
ON public.feedbacks
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all feedback"
ON public.feedbacks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create content ratings table for specific content items
CREATE TABLE public.content_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'manasik', 'prayer', 'location'
  content_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for content ratings
CREATE POLICY "Users can create own ratings"
ON public.content_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
ON public.content_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view ratings"
ON public.content_ratings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all ratings"
ON public.content_ratings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for content_ratings
CREATE TRIGGER update_content_ratings_updated_at
BEFORE UPDATE ON public.content_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();