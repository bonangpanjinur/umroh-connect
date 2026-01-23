-- Create travel_reviews table for rating & reviews
CREATE TABLE public.travel_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_id UUID NOT NULL REFERENCES public.travels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(travel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews"
ON public.travel_reviews
FOR SELECT
USING (is_published = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can create reviews (one per travel)
CREATE POLICY "Users can create reviews"
ON public.travel_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews"
ON public.travel_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews"
ON public.travel_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.travel_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_travel_reviews_updated_at
BEFORE UPDATE ON public.travel_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update travel rating when reviews change
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
$$;

-- Create triggers to update travel rating
CREATE TRIGGER update_travel_rating_on_insert
AFTER INSERT ON public.travel_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_rating();

CREATE TRIGGER update_travel_rating_on_update
AFTER UPDATE ON public.travel_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_rating();

CREATE TRIGGER update_travel_rating_on_delete
AFTER DELETE ON public.travel_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_rating();