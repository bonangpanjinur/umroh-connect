#!/usr/bin/env node
import crypto from 'node:crypto';

const required = ['LEAD_ROUTING_URL', 'INTEGRATION_KEY', 'INTEGRATION_SECRET', 'INSTALLATION_ID'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(2);
}

const leadUrl = process.env.LEAD_ROUTING_URL;
const catalogUrl = process.env.CATALOG_INGEST_URL;
const keyId = process.env.INTEGRATION_KEY;
const secret = process.env.INTEGRATION_SECRET;
const installationId = process.env.INSTALLATION_ID;
const allowCatalogWrite = process.argv.includes('--allow-catalog-write');
const leadKey = `pilot-smoke-${Date.now()}-${crypto.randomUUID()}`;
const testName = process.env.SMOKE_TEST_NAME || 'Pilot Smoke Test';
const testPhone = process.env.SMOKE_TEST_PHONE || '+6281111111111';
const testEmail = process.env.SMOKE_TEST_EMAIL || `pilot-smoke-${Date.now()}@example.invalid`;
const productId = process.env.SMOKE_TEST_PRODUCT_ID || null;
const domain = process.env.SMOKE_TEST_DOMAIN || null;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const sign = (url, body, timestamp, nonce) => {
  const derivedKey = sha256(secret);
  const canonical = `POST\n${new URL(url).pathname}\n${timestamp}\n${nonce}\n${sha256(body)}`;
  return crypto.createHmac('sha256', derivedKey).update(canonical).digest('hex');
};
const json = async (response) => response.json().catch(() => ({}));

async function callSigned(url, payload, idempotencyKey) {
  const body = JSON.stringify({ ...payload, installation_id: installationId });
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const response = await fetch(url, { method: 'POST', headers: {
    'content-type': 'application/json',
    'x-integration-key': keyId,
    'x-integration-timestamp': timestamp,
    'x-integration-nonce': nonce,
    'x-integration-signature': sign(url, body, timestamp, nonce),
    ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  }, body });
  const data = await json(response);
  if (!response.ok) throw new Error(`${url} returned ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function submitLead() {
  const payload = { full_name: testName, phone: testPhone, email: testEmail, message: 'Automated pilot smoke test; jangan diproses sebagai jamaah nyata.', ...(productId ? { product_id: productId } : {}), ...(domain ? { source_domain: domain } : {}) };
  const first = await fetch(leadUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': leadKey }, body: JSON.stringify(payload) });
  const firstData = await json(first);
  if (!first.ok || !firstData?.data?.lead_id) throw new Error(`Lead submit failed: ${first.status} ${JSON.stringify(firstData)}`);
  const second = await fetch(leadUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': leadKey }, body: JSON.stringify(payload) });
  const secondData = await json(second);
  if (!second.ok || secondData?.data?.status !== 'duplicate') throw new Error(`Lead idempotency failed: ${second.status} ${JSON.stringify(secondData)}`);
  console.log(`PASS lead submit + idempotency: ${firstData.data.lead_id}`);
  return firstData.data.lead_id;
}

async function pullAndAck() {
  const pulled = await callSigned(leadUrl, { action: 'pull', limit: 20 });
  const deliveries = Array.isArray(pulled?.data) ? pulled.data : [];
  const ours = deliveries.find((item) => item?.central_leads?.email === testEmail);
  if (!ours) throw new Error(`Pilot lead was not returned by pull. Pulled ${deliveries.length} delivery record(s).`);
  const ack = await callSigned(leadUrl, { action: 'ack', delivery_id: ours.id, status: 'accepted' });
  if (ack?.data?.status !== 'accepted') throw new Error(`Lead acknowledgement failed: ${JSON.stringify(ack)}`);
  console.log(`PASS lead pull + acknowledgement: ${ours.id}`);
}

async function catalogSmoke() {
  if (!catalogUrl) { console.log('SKIP catalog write: CATALOG_INGEST_URL is not set.'); return; }
  if (!allowCatalogWrite) { console.log('SKIP catalog write: pass --allow-catalog-write explicitly; default is non-mutating.'); return; }
  const entityId = process.env.SMOKE_TEST_ENTITY_ID;
  const version = Number(process.env.SMOKE_TEST_ENTITY_VERSION || 1);
  const data = process.env.SMOKE_TEST_CATALOG_DATA ? JSON.parse(process.env.SMOKE_TEST_CATALOG_DATA) : null;
  if (!entityId || !data) throw new Error('Catalog write requires SMOKE_TEST_ENTITY_ID, SMOKE_TEST_ENTITY_VERSION, and SMOKE_TEST_CATALOG_DATA JSON.');
  const event = { event_id: `pilot-smoke:${entityId}:${version}:${crypto.randomUUID()}`, event_type: 'package.upserted', event_version: 1, occurred_at: new Date().toISOString(), source: { installation_id: installationId, entity_type: 'package', entity_id: entityId, entity_version: version }, data };
  const result = await callSigned(catalogUrl, event);
  if (!['processed', 'stale'].includes(result?.data?.status)) throw new Error(`Catalog ingestion failed: ${JSON.stringify(result)}`);
  console.log(`PASS catalog ingestion: ${result.data.status}`);
}

console.log(`Running pilot smoke test for installation ${installationId}`);
await submitLead();
await pullAndAck();
await catalogSmoke();
console.log('SMOKE TEST PASSED');
