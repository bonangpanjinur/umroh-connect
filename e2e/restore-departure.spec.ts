import { expect, test } from '@playwright/test';

const enabled = process.env.E2E_ENABLED === 'true';
const packageId = process.env.E2E_PACKAGE_ID;
const expectedPackageName = process.env.E2E_PACKAGE_NAME || 'Paket Amanah';
const tenantId = process.env.E2E_TENANT_ID;
const branchId = process.env.E2E_BRANCH_ID;

test.describe('management restore package departures', () => {
  test.skip(!enabled || !packageId || !tenantId || !branchId, 'Set E2E_ENABLED, E2E_PACKAGE_ID, E2E_TENANT_ID, and E2E_BRANCH_ID for integration E2E.');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ tenant, branch }) => {
      localStorage.setItem('arahumroh_active_tenant_id', tenant);
      localStorage.setItem('arahumroh_active_branch_id', branch);
    }, { tenant: tenantId!, branch: branchId! });
  });

  test('restores cancelled future departures through Core API and refreshes UI', async ({ page }) => {
    const restoreRequest = page.waitForRequest((request) =>
      request.method() === 'POST' && request.url().includes(`/management/packages/${packageId}/departures/restore`),
    );
    const restoreResponse = page.waitForResponse((response) =>
      response.request().method() === 'POST' && response.url().includes(`/management/packages/${packageId}/departures/restore`),
    );

    await page.goto('/agent');
    await expect(page.getByText(expectedPackageName, { exact: false }).first()).toBeVisible();
    await page.getByText(expectedPackageName, { exact: false }).first().click();
    await page.getByRole('button', { name: /Pulihkan \(\d+\)/i }).click();

    const request = await restoreRequest;
    expect(request.headers()['x-tenant-id']).toBe(tenantId);
    expect(request.headers()['x-branch-id']).toBe(branchId);
    expect(request.postDataJSON()).toEqual(expect.objectContaining({ reason: expect.stringContaining(expectedPackageName) }));

    const response = await restoreResponse;
    expect(response.ok()).toBeTruthy();
    await expect(page.getByText(/jadwal dipulihkan/i)).toBeVisible();
  });

  test('shows branch scope error and keeps the restore action available', async ({ page }) => {
    await page.route('**/management/packages/*/departures/restore', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        headers: { 'x-request-id': 'e2e-branch-scope' },
        body: JSON.stringify({ error: {
          code: 'BRANCH_SCOPE_DENIED',
          message: 'Departure berada di luar scope branch aktif Anda.',
          request_id: 'e2e-branch-scope',
        } }),
      });
    });

    await page.goto('/agent');
    await expect(page.getByText(expectedPackageName, { exact: false }).first()).toBeVisible();
    await page.getByText(expectedPackageName, { exact: false }).first().click();
    const restoreButton = page.getByRole('button', { name: /Pulihkan \(\d+\)/i });
    await restoreButton.click();

    await expect(page.getByText(/di luar scope branch aktif/i)).toBeVisible();
    await expect(restoreButton).toBeEnabled();
  });
});
