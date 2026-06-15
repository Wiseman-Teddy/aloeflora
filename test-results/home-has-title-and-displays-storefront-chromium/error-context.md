# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> has title and displays storefront
- Location: e2e\home.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('has title and displays storefront', async ({ page }) => {
> 4  |   await page.goto('/');
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  5  |   
  6  |   // Wait for the app to load
  7  |   await expect(page.locator('text=ALOEFLORA').first()).toBeVisible();
  8  |   
  9  |   // Verify storefront tab is active by default
  10 |   const storeTab = page.locator('button:has-text("Customer Storefront")');
  11 |   await expect(storeTab).toBeVisible();
  12 | });
  13 | 
  14 | test('can navigate to admin console', async ({ page }) => {
  15 |   await page.goto('/');
  16 |   
  17 |   // Click admin console tab
  18 |   const adminTab = page.locator('button:has-text("Consolidated Admin Console")');
  19 |   await adminTab.click();
  20 |   
  21 |   // Check role indicator
  22 |   await expect(page.locator('text=Role: Admin')).toBeVisible();
  23 | });
  24 | 
```