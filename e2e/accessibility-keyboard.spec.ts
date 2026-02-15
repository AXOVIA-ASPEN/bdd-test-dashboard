import { test, expect } from '@playwright/test';

test.describe('Accessibility & Keyboard Navigation', () => {
  // Given a user relies on keyboard navigation
  // When they interact with the dashboard
  // Then all interactive elements should be reachable and usable via keyboard

  test('should have a descriptive page title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should allow focusing a project link and activating with Enter', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h4.font-semibold').first()).toBeVisible({ timeout: 15000 });

    // Find the first project link
    const firstProjectLink = page.locator('a').filter({ has: page.locator('h4.font-semibold') }).first();
    const href = await firstProjectLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Focus and activate via keyboard
    await firstProjectLink.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(`**${href}`, { timeout: 10000 });
    expect(page.url()).toContain(href!);
  });

  test('should have no images missing alt attributes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
    const badImages = await page.locator('img:not([alt])').count();
    expect(badImages).toBe(0);
  });

  test('should have visible and non-empty heading text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await headings.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should remain stable after pressing Escape key', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Escape');
    // Page should still be functional
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible();
  });

  test('should have all links with valid href attributes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h4.font-semibold').first()).toBeVisible({ timeout: 15000 });

    const links = page.locator('a[href]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });
});
