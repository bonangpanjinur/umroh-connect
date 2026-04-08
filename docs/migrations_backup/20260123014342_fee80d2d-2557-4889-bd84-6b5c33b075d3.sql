-- Create storage bucket for haji documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('haji-documents', 'haji-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for haji documents (private bucket)
CREATE POLICY "Users can upload own haji documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'haji-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own haji documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'haji-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'agent'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete own haji documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'haji-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);