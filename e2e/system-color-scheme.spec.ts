import { test, expect } from '@playwright/test';

test.describe('System Color Scheme - Dark Mode Default & Visual Consistency', () => {
  // The app defaults to dark mode. These tests verify that the dark theme
  // renders correctly and that toggling to light mode produces proper contrast.

  test('should default to dark mode on fresh visit', async ({ browser }) => {
    // Given a new user with no stored theme preference
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    // When they visit the dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Then the page should be in dark mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/, { timeout: 10000 });

    await context.close();
  });

  test('should also default to dark mode even when system prefers light', async ({ browser }) => {
    // Given a user whose OS is set to light mode
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();

    // When they visit the dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Then the app still defaults to dark mode (app default, not system-driven)
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/, { timeout: 10000 });

    await context.close();
  });

  test('should have a dark background color in default dark mode', async ({ browser }) => {
    // Given the dashboard loads in dark mode
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 10000 });

    // Then the body background should be dark-toned
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(128);
    }

    await context.close();
  });

  test('should have a light background after toggling to light mode', async ({ browser }) => {
    // Given the dashboard is in dark mode
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');

    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });

    // When the user toggles to light mode
    await toggleBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 5000 });

    // Then the body background should be light-toned
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeGreaterThan(128);
    }

    await context.close();
  });

  test('should keep text readable in both dark and light modes', async ({ browser }) => {
    // Given the dashboard in dark mode
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Then heading text should be light-colored on dark background
    const darkTextColor = await heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const darkMatch = darkTextColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (darkMatch) {
      const brightness = (Number(darkMatch[1]) + Number(darkMatch[2]) + Number(darkMatch[3])) / 3;
      expect(brightness).toBeGreaterThan(128); // light text on dark bg
    }

    // When toggled to light mode
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await toggleBtn.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 5000 });

    // Then heading text should be dark-colored on light background
    const lightTextColor = await heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const lightMatch = lightTextColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (lightMatch) {
      const brightness = (Number(lightMatch[1]) + Number(lightMatch[2]) + Number(lightMatch[3])) / 3;
      expect(brightness).toBeLessThan(128); // dark text on light bg
    }

    await context.close();
  });
});
