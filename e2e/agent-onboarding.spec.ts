import { expect, test, type Page } from '@playwright/test';

const enabled = process.env.E2E_ENABLED === 'true';
const tenantApplicationUrl = '**/api/v1/platform/tenant-applications';
const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

test.describe('agent onboarding', () => {
  test.skip(!enabled, 'Set E2E_ENABLED=true with an authenticated storage state to run onboarding E2E.');

  test.beforeEach(async ({ page }) => {
    await page.route('**/storage/v1/object/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'e2e/agent-docs/siup.pdf' }) });
        return;
      }
      await route.continue();
    });
  });

  async function completeForm(page: Page, upload = true) {
    await page.goto(`${baseUrl}/agent/onboarding`);
    await expect(page.getByRole('heading', { name: 'Daftar sebagai Agen Travel' })).toBeVisible();

    await page.getByLabel('Nama Travel').fill('PT Travel Amanah E2E');
    await page.getByLabel('Deskripsi Travel (Opsional)').fill('Travel integration test');
    await page.getByRole('button', { name: /Lanjut/i }).click();

    await page.getByLabel('Nomor Telepon *').fill('+628123456789');
    await page.getByLabel('Nomor WhatsApp').fill('+628123456789');
    await page.getByLabel('Email').fill('e2e-owner@example.com');
    await page.getByLabel('Alamat Kantor').fill('Jl. Integration Test No. 1');
    await page.getByRole('button', { name: /Lanjut/i }).click();

    if (upload) {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'siup-e2e.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 e2e fixture'),
      });
      await expect(page.getByText('1 dokumen terupload')).toBeVisible();
    }
    await page.getByRole('button', { name: /Lanjut/i }).click();
    await expect(page.getByRole('heading', { name: 'Konfirmasi Pendaftaran' })).toBeVisible();
  }

  test('submits onboarding, preserves document path, and shows success state', async ({ page }) => {
    let requestCount = 0;
    const requestPromise = page.waitForRequest((request) => request.url().includes('/platform/tenant-applications'));
    await page.route(tenantApplicationUrl, async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: {
          id: 'e2e-application-1',
          company_name: 'PT Travel Amanah E2E',
          status: 'pending',
          documents: ['e2e/agent-docs/siup.pdf'],
        }, meta: { idempotent: false, request_id: 'e2e-request-1' } }),
      });
    });

    await completeForm(page);
    await page.getByRole('button', { name: 'Kirim Pendaftaran' }).click();

    const request = await requestPromise;
    expect(request.method()).toBe('POST');
    expect(request.headers()['idempotency-key']).toBeTruthy();
    expect(request.headers()['x-request-id']).toBeTruthy();
    expect(request.postDataJSON()).toEqual(expect.objectContaining({
      company_name: 'PT Travel Amanah E2E',
      email: 'e2e-owner@example.com',
      documents: ['e2e/agent-docs/siup.pdf'],
      requested_plan: 'basic',
    }));
    expect(requestCount).toBe(1);
    await expect(page.getByRole('heading', { name: 'Pendaftaran Terkirim!' })).toBeVisible();
  });

  test('shows existing application error without entering success state', async ({ page }) => {
    await page.route(tenantApplicationUrl, async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        headers: { 'x-request-id': 'e2e-duplicate' },
        body: JSON.stringify({ error: {
          code: 'ACTIVE_APPLICATION_EXISTS',
          message: 'Anda masih memiliki pengajuan tenant yang sedang diproses.',
          request_id: 'e2e-duplicate',
        } }),
      });
    });

    await completeForm(page, false);
    await page.getByRole('button', { name: 'Kirim Pendaftaran' }).click();
    await expect(page.getByText('Anda masih memiliki pengajuan tenant yang sedang diproses.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pendaftaran Terkirim!' })).not.toBeVisible();
  });
});
