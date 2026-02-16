import { test, expect } from '@playwright/test';

test.describe('Rapid Navigation - App handles fast page transitions gracefully', () => {
  // Given: A single-page app with client-side routing
  // When: A user navigates back and forth quickly
  // Then: The app should settle into a valid state without crashes

  test('should survive back-forward navigation without JS errors', async ({ page }) => {
    // Given: the dashboard is loaded
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // When: user clicks a project card
    const projectLink = page.locator('a[href*="/project/"]').first();
    const hasProject = await projectLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasProject) {
      test.skip();
      return;
    }

    await projectLink.click();
    await page.waitForURL('**/project/**', { timeout: 15000 });

    // When: user hits back
    await page.goBack();
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // When: user hits forward
    await page.goForward();
    await expect(page).toHaveURL(/\/project\//, { timeout: 15000 });

    // Then: page has content and no JS errors
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('should handle multiple sequential page navigations cleanly', async ({ page }) => {
    // Given: dashboard is loaded
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    const projectLinks = page.locator('a[href*="/project/"]');
    const count = await projectLinks.count();
    if (count < 2) {
      test.skip();
      return;
    }

    // When: navigate to project 1, back, project 2
    await projectLinks.first().click();
    await page.waitForURL('**/project/**', { timeout: 15000 });

    await page.goBack();
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
    // Wait for project links to re-render after navigation
    await expect(projectLinks.nth(1)).toBeVisible({ timeout: 10000 });

    await projectLinks.nth(1).click();
    await page.waitForURL('**/project/**', { timeout: 15000 });

    // Then: we're on a valid project page with no errors
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('should handle direct URL navigation to invalid project gracefully', async ({ page }) => {
    // Given: user navigates to a non-existent project
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/project/zzz-does-not-exist-999');

    // Then: page should render without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(0);

    // When: user navigates to homepage
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // Then: homepage works normally after visiting invalid route
    expect(errors).toEqual([]);
  });
});
