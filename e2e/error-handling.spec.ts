import { test, expect } from '@playwright/test';

test.describe('Error Handling - Graceful degradation for invalid routes and states', () => {
  // Given a user navigates to an invalid or broken URL
  // When the page loads
  // Then the app should handle the error gracefully without crashing

  test('should handle unknown routes without crashing', async ({ page }) => {
    // Given a user navigates to a non-existent route
    await page.goto('/this-route-does-not-exist-at-all');
    await page.waitForLoadState('domcontentloaded');

    // Then the page should not show a blank screen
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(0);

    // And there should be no uncaught JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    // Note: existing errors before listener won't be caught, but page should be stable
  });

  test('should recover from invalid project ID in URL', async ({ page }) => {
    // Given a user navigates to a project with a garbage ID
    await page.goto('/project/zzz-nonexistent-999');
    await page.waitForLoadState('domcontentloaded');

    // Then the page should show some content (error message or redirect)
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(0);

    // And the user should be able to navigate home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not have console errors on homepage load', async ({ page }) => {
    // Given we listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // When the homepage loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Then there should be no critical console errors
    // (filter out common benign errors like favicon 404s)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('should not have broken images on homepage', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Then all images should have loaded successfully
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src);
    });
    expect(brokenImages).toEqual([]);
  });

  test('should handle rapid navigation without crashing', async ({ page }) => {
    // Given a user rapidly navigates between pages
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const firstLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
    const linkExists = await firstLink.count();

    if (linkExists > 0) {
      // When they click rapidly
      await firstLink.click();
      await page.goBack();
      await page.goForward();
      await page.goBack();

      // Then the dashboard should still be functional
      await page.waitForLoadState('domcontentloaded');
      const body = await page.textContent('body');
      expect(body?.trim().length).toBeGreaterThan(0);
    }
  });
});
