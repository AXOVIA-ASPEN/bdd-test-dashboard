import { test, expect } from '@playwright/test';

test.describe('Skip to Content Link - Keyboard accessibility shortcut', () => {
  // Given the dashboard has a "Skip to content" link for keyboard users
  // When a user tabs into the page
  // Then they can skip navigation and jump directly to main content

  test('should have a skip-to-content link as the first focusable element', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // When the user presses Tab to focus the first element
    await page.keyboard.press('Tab');

    // Then the skip-to-content link should be focused
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveText(/skip to content/i);
  });

  test('should be visually hidden by default and visible on focus', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const skipLink = page.locator('a[href="#main-content"]');

    // Then the skip link should exist but be visually hidden (sr-only)
    await expect(skipLink).toBeAttached();
    const box = await skipLink.boundingBox();
    // sr-only elements have effectively zero visible dimensions
    expect(box === null || box.width <= 1 || box.height <= 1).toBeTruthy();

    // When the user tabs to focus the skip link
    await page.keyboard.press('Tab');

    // Then it should become visible
    const focusedBox = await skipLink.boundingBox();
    expect(focusedBox).not.toBeNull();
    expect(focusedBox!.width).toBeGreaterThan(10);
    expect(focusedBox!.height).toBeGreaterThan(10);
  });

  test('should scroll to main content when activated', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // When the user tabs to the skip link and activates it
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Then the #main-content element should be in view
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    await expect(main).toBeInViewport();
  });

  test('skip link should work on project detail pages too', async ({ page }) => {
    // Given a project detail page is loaded
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for project links to appear
    const projectLink = page.locator('a[href*="/project"]').first();
    try {
      await projectLink.waitFor({ timeout: 10000 });
    } catch {
      // No projects available - skip this test
      test.skip();
      return;
    }

    await projectLink.click();
    await page.waitForLoadState('domcontentloaded');

    // When the user tabs to the skip link
    await page.keyboard.press('Tab');

    // Then the skip link should be focusable here too
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
  });
});
