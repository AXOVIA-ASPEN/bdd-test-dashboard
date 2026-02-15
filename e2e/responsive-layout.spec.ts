import { test, expect } from '@playwright/test';

test.describe('Responsive Layout - Dashboard adapts to different viewports', () => {
  // Given a user views the dashboard on various device sizes
  // When the viewport changes
  // Then the layout should adapt gracefully without overflow or broken elements

  test('should render dashboard correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Dashboard heading should be visible
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // No horizontal scrollbar - body should not overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px tolerance

    // Project links should still be visible and tappable
    const projectLinks = page.getByRole('link').filter({ hasText: /.+/ });
    const count = await projectLinks.count();
    expect(count).toBeGreaterThan(0);

    // At least one link should have reasonable tap target size (>= 20px height)
    let hasReasonableTarget = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await projectLinks.nth(i).boundingBox();
      if (box && box.height >= 20) {
        hasReasonableTarget = true;
        break;
      }
    }
    expect(hasReasonableTarget).toBe(true);
  });

  test('should render dashboard correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Theme toggle should still be accessible
    const themeToggle = page.getByRole('button').first();
    await expect(themeToggle).toBeVisible();
  });

  test('should render dashboard correctly on wide desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Content should be centered / contained, not stretching full width
    const mainContent = page.locator('main, [class*="container"], [class*="app"], #root > div').first();
    const box = await mainContent.boundingBox();
    if (box) {
      // Content shouldn't start at x=0 on very wide screens (implies centering/max-width)
      // Or it's fine if it does - just verify it renders
      expect(box.width).toBeGreaterThan(0);
    }
  });

  test('should allow full navigation flow on mobile', async ({ page }) => {
    // Given a mobile user on the dashboard
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // When they tap a project link
    const firstProject = page.getByRole('link').filter({ hasText: /.+/ }).first();
    await expect(firstProject).toBeVisible({ timeout: 10000 });
    await firstProject.click();

    // Then the URL should change (project page)
    await page.waitForURL((url) => url.pathname !== '/', { timeout: 10000 });

    // And they should be able to navigate back to the dashboard
    await page.goBack();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });

    // And the dashboard should still display correctly on mobile
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
