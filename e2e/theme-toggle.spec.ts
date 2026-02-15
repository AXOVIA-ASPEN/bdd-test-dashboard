import { test, expect } from '@playwright/test';

test.describe('Theme Toggle - Switch between dark and light mode', () => {
  // Given a user is on the dashboard
  // When they click the theme toggle button
  // Then the theme should switch between dark and light mode

  test('should have a theme toggle button visible', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
  });

  test('should toggle theme class on html element when clicked', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // Get initial theme
    const initialTheme = await page.locator('html').getAttribute('class');
    const startedDark = initialTheme?.includes('dark') ?? false;

    // Click toggle
    await toggleBtn.click();

    // Theme class should change
    if (startedDark) {
      await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 5000 });
    } else {
      await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });
    }
  });

  test('should swap the icon between Sun and Moon on toggle', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // Check which SVG icon is present initially
    const hasSunBefore = await toggleBtn.locator('svg').count() > 0;
    expect(hasSunBefore).toBe(true);

    // Get initial icon content
    const initialSvg = await toggleBtn.locator('svg').innerHTML();

    // Toggle
    await toggleBtn.click();
    await page.waitForTimeout(300); // animation

    // Icon SVG content should change
    const afterSvg = await toggleBtn.locator('svg').innerHTML();
    expect(afterSvg).not.toBe(initialSvg);
  });

  test('should toggle back to original theme on double click', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    const initialTheme = await page.locator('html').getAttribute('class');

    // Toggle twice
    await toggleBtn.click();
    await page.waitForTimeout(300);
    await toggleBtn.click();
    await page.waitForTimeout(300);

    // Should be back to initial state
    const finalTheme = await page.locator('html').getAttribute('class');
    expect(finalTheme).toBe(initialTheme);
  });
});
