import { test, expect } from '@playwright/test';

test.describe('Zoom Accessibility - App remains usable at 200% zoom (WCAG 1.4.4)', () => {
  // Given: A user with low vision zooms the browser to 200%
  // When: They interact with the dashboard
  // Then: All content should remain visible, readable, and interactive

  test('should display dashboard heading at 200% zoom without horizontal scroll', async ({ page }) => {
    // Given: The viewport simulates 200% zoom (half-width viewport)
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');

    // Then: The dashboard heading should be visible
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });

    // And: No content should overflow horizontally
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('should keep project cards accessible at 200% zoom', async ({ page }) => {
    // Given: The user views the dashboard at 200% zoom
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });

    // Then: Project cards/links should still be visible and clickable
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });

    // And: The link should have a reasonable minimum tap target size (44x44px per WCAG 2.5.8)
    const box = await projectLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should keep navigation functional at 200% zoom', async ({ page }) => {
    // Given: The user is on the dashboard at 200% zoom
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });

    // When: They click a project link
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();

    // Then: The project detail page should load (URL changes)
    await expect(page).not.toHaveURL('/', { timeout: 10000 });

    // And: Content should be visible on the detail page
    await expect(page.locator('h3, h4').first()).toBeVisible({ timeout: 15000 });
  });

  test('should keep theme toggle accessible at 200% zoom', async ({ page }) => {
    // Given: The user views the page at 200% zoom
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });

    // Then: The theme toggle button should be visible and within viewport
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    const box = await themeToggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(640 + 5);
  });

  test('should not have unreadably small text at 200% zoom', async ({ page }) => {
    // Given: The user views the dashboard at 200% zoom
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });

    // Then: No visible text elements should have font-size below 10px
    const smallTextCount = await page.evaluate(() => {
      const allText = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label');
      let tooSmall = 0;
      allText.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 10 && el.textContent?.trim()) tooSmall++;
      });
      return tooSmall;
    });
    expect(smallTextCount).toBe(0);
  });
});
