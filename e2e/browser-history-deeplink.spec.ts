import { test, expect } from '@playwright/test';

test.describe('Browser History & Deep Linking - SPA routing works correctly', () => {
  // Given a single-page application with client-side routing
  // When a user navigates using browser back/forward buttons or direct URLs
  // Then the correct content should render without full page reloads

  test('should navigate back to dashboard using browser back button', async ({ page }) => {
    // Given: user is on the dashboard and clicks into a project
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // When: they press the browser back button
    await page.goBack();

    // Then: the dashboard should render with project cards
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate forward after going back', async ({ page }) => {
    // Given: user navigated to a project, then went back
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    const projectHref = await projectLink.getAttribute('href');
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
    await page.goBack();
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // When: they press the browser forward button
    await page.goForward();

    // Then: the project detail page should render again
    await expect(page).toHaveURL(new RegExp(projectHref!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 10000 });
  });

  test('should handle deep link to a project page directly', async ({ page }) => {
    // Given: we know a project exists on the dashboard
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    const projectHref = await projectLink.getAttribute('href');
    const projectName = await projectLink.locator('h4').innerText();

    // When: a user navigates directly to that project URL (deep link)
    await page.goto(projectHref!);

    // Then: the project page should load correctly with the project name
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });
    // And: a back link to the dashboard should be available
    await expect(page.locator('a[href="/"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle deep link to root and show full dashboard', async ({ page }) => {
    // Given: a user bookmarked the dashboard URL
    // When: they navigate directly to the root
    await page.goto('/');

    // Then: the full dashboard should render with title and projects
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 10000 });
    const projectCards = page.locator('a[href*="/project/"]');
    await expect(projectCards.first()).toBeVisible({ timeout: 10000 });
    expect(await projectCards.count()).toBeGreaterThan(0);
  });

  test('should maintain theme preference across navigation', async ({ page }) => {
    // Given: user toggles theme on the dashboard
    await page.goto('/');
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    const initialTheme = await page.locator('html').getAttribute('class');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    const toggledTheme = await page.locator('html').getAttribute('class');
    expect(toggledTheme).not.toBe(initialTheme);

    // When: they navigate to a project page
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Then: the theme should persist
    const projectPageTheme = await page.locator('html').getAttribute('class');
    expect(projectPageTheme).toBe(toggledTheme);

    // And when navigating back
    await page.goBack();
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
    const backTheme = await page.locator('html').getAttribute('class');
    expect(backTheme).toBe(toggledTheme);
  });
});
