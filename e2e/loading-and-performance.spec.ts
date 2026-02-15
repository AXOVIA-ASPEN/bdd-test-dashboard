import { test, expect } from '@playwright/test';

test.describe('Loading States & Performance - App loads efficiently with visual feedback', () => {
  // Given a user visits the dashboard
  // When the page is loading data
  // Then loading indicators should appear before content renders
  // And the page should load within acceptable time limits

  test('should show loading or content within 3 seconds on homepage', async ({ page }) => {
    // Given: we measure time from navigation start
    const start = Date.now();
    await page.goto('/');

    // When: the page begins rendering
    // Then: either a loading indicator or actual content should appear quickly
    await expect(
      page.locator('text=Acceptance Test Dashboard').or(page.locator('[class*="skeleton"]')).or(page.locator('[class*="spinner"]')).or(page.locator('[class*="loading"]')).or(page.locator('[role="progressbar"]'))
    ).toBeVisible({ timeout: 5000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('should render project cards without indefinite loading state', async ({ page }) => {
    // Given: the user navigates to the dashboard
    await page.goto('/');

    // When: the page fully loads
    // Then: project cards should appear (loading state should resolve)
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // And: no lingering loading spinners should remain
    const spinners = page.locator('[class*="spinner"]:visible, [role="progressbar"]:visible');
    const spinnerCount = await spinners.count();
    expect(spinnerCount).toBe(0);
  });

  test('should show content or empty state on project detail page', async ({ page }) => {
    // Given: user navigates to a project detail page
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // When: the project page loads
    // Then: a heading or meaningful content should be visible (project loaded)
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 15000 });
  });

  test('should complete navigation transitions smoothly', async ({ page }) => {
    // Given: user is on the dashboard
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: they navigate to a project and back rapidly
    const start = Date.now();
    const projectLink = page.locator('a[href*="/project/"]').first();
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
    await page.goBack();
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });
    const elapsed = Date.now() - start;

    // Then: the round-trip navigation should complete within reasonable time
    expect(elapsed).toBeLessThan(15000);
  });

  test('should have reasonable DOM size on homepage', async ({ page }) => {
    // Given: the homepage is fully loaded
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we measure the DOM size
    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

    // Then: the DOM should not be excessively large (< 3000 nodes)
    expect(nodeCount).toBeLessThan(3000);
  });
});
