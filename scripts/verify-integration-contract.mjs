import { existsSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const required = [
  'supabase/migrations/20260904090000_create_tenant_registry.sql',
  'supabase/migrations/20260905090000_create_central_catalog_sync.sql',
  'supabase/migrations/20260907120000_create_central_lead_routing.sql',
  'supabase/functions/catalog-ingest/index.ts',
  'supabase/functions/lead-routing/index.ts',
  'supabase/functions/lead-admin/index.ts',
  'src/components/admin/LeadObservability.tsx',
];
const checks = [
  ['central leads table', 'supabase/migrations/20260907120000_create_central_lead_routing.sql', /CREATE TABLE IF NOT EXISTS public\.central_leads/],
  ['delivery uniqueness', 'supabase/migrations/20260907120000_create_central_lead_routing.sql', /UNIQUE \(lead_id, installation_id\)/],
  ['lead idempotency', 'supabase/functions/lead-routing/index.ts', /idempotency_key/],
  ['lead acknowledgement', 'supabase/functions/lead-routing/index.ts', /action === 'ack'/],
  ['lead scope authorization', 'supabase/functions/lead-routing/index.ts', /requireScope\('lead\.read'\)/],
  ['claim status guard', 'supabase/functions/lead-routing/index.ts', /eq\('status', 'pending'\)/],
  ['admin retry', 'supabase/functions/lead-admin/index.ts', /action === 'retry'/],
  ['exact metrics', 'supabase/functions/lead-admin/index.ts', /count: 'exact'/],
  ['HMAC verification', 'supabase/functions/lead-routing/index.ts', /x-integration-signature/],
  ['dashboard metrics', 'src/components/admin/LeadObservability.tsx', /Lead Observability/],
  ['local product mapping', 'supabase/functions/lead-routing/index.ts', /central_catalog_products\(name,source_id\)/],
];
for (const path of required) if (!existsSync(`${root}/${path}`)) throw new Error(`Missing required artifact: ${path}`);
for (const [name, path, pattern] of checks) {
  if (!pattern.test(readFileSync(`${root}/${path}`, 'utf8'))) throw new Error(`Failed check: ${name}`);
}
console.log(`Integration contract smoke test passed (${required.length} artifacts, ${checks.length} assertions).`);
