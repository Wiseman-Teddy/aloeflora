import { test, expect } from '@playwright/test';

test('has title and displays storefront', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the app to load
  await expect(page.locator('text=ALOEFLORA').first()).toBeVisible();
  
  // Verify storefront tab is active by default
  const storeTab = page.locator('button:has-text("Customer Storefront")');
  await expect(storeTab).toBeVisible();
});

test('can navigate to admin console', async ({ page }) => {
  await page.goto('/');
  
  // Click admin console tab
  const adminTab = page.locator('button:has-text("Consolidated Admin Console")');
  await adminTab.click();
  
  // Check role indicator
  await expect(page.locator('text=Role: Admin')).toBeVisible();
});
