import { test, expect } from '@playwright/test';

test.describe('Theme Persistence - Theme choice survives page reload', () => {
  // Given a user visits the dashboard and toggles the theme
  // When they reload or open a new tab
  // Then the chosen theme should still be applied

  test('should persist theme preference after page reload', async ({ page }) => {
    // Given: user is on the dashboard
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // Capture initial theme
    const initialTheme = await page.locator('html').getAttribute('class');

    // When: user toggles the theme
    await toggleBtn.click();
    await page.waitForTimeout(500);
    const toggledTheme = await page.locator('html').getAttribute('class');
    expect(toggledTheme).not.toBe(initialTheme);

    // And: reloads the page
    await page.reload();
    await expect(page.locator('button[aria-label="Toggle theme"]')).toBeVisible({ timeout: 15000 });

    // Then: theme should be preserved
    const persistedTheme = await page.locator('html').getAttribute('class');
    expect(persistedTheme).toBe(toggledTheme);
  });

  test('should store theme preference in localStorage', async ({ page }) => {
    // Given: user is on the dashboard
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // When: user toggles the theme
    await toggleBtn.click();
    await page.waitForTimeout(500);

    // Then: localStorage should contain theme preference
    const stored = await page.evaluate(() => localStorage.getItem('bdd-theme'));
    expect(stored).not.toBeNull();
    expect(['light', 'dark']).toContain(stored);
  });

  test('should apply stored theme on new tab in same context', async ({ page, context }) => {
    // Given: user toggles theme on the dashboard
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    await toggleBtn.click();
    await page.waitForTimeout(500);
    const toggledTheme = await page.locator('html').getAttribute('class');

    // When: user opens the dashboard in a new tab (same browser context = shared localStorage)
    const newPage = await context.newPage();
    await newPage.goto('/');
    await expect(newPage.locator('button[aria-label="Toggle theme"]')).toBeVisible({ timeout: 15000 });

    // Then: new tab should have the same theme
    const newPageTheme = await newPage.locator('html').getAttribute('class');
    expect(newPageTheme).toBe(toggledTheme);
    await newPage.close();
  });
});
