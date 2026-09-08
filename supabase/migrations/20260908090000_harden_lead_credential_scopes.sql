-- Fase audit: credential integrasi harus dapat menarik dan meng-acknowledge lead.
UPDATE public.tenant_credentials
SET scopes = ARRAY(
  SELECT DISTINCT scope
  FROM unnest(COALESCE(scopes, ARRAY[]::TEXT[]) || ARRAY['lead.read', 'lead.write']::TEXT[]) AS scope
)
WHERE NOT (scopes @> ARRAY['lead.read', 'lead.write']::TEXT[]);
