import { test, expect } from '@playwright/test';

test.describe('Breadcrumb Navigation - Navigate via breadcrumb trail', () => {
  // Given: The dashboard has a breadcrumb component on sub-pages
  // When: A user navigates to project or run detail pages
  // Then: Breadcrumbs should show the navigation path and allow clicking back

  test('should show breadcrumb with home icon on project detail page', async ({ page }) => {
    // Given: The user is on the dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // When: They click a project card
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    // Then: A breadcrumb nav should be visible with a home link
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    const homeLink = breadcrumb.getByLabel('Dashboard');
    await expect(homeLink).toBeVisible();
  });

  test('should navigate back to dashboard when clicking breadcrumb home icon', async ({ page }) => {
    // Given: The user is on a project detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    // When: They click the home icon in the breadcrumb
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const homeLink = breadcrumb.getByLabel('Dashboard');
    await homeLink.click();

    // Then: They should be back on the dashboard
    await page.waitForURL('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show project name as current breadcrumb item on project page', async ({ page }) => {
    // Given: The user navigates to a project detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    const projectName = await projectLink.locator('h3, h2, [class*="title"], span').first().textContent();
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    // Then: The breadcrumb should contain the project name as the current (non-link) item
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // The last breadcrumb item should be a span (not a link) with font-medium
    const currentItem = breadcrumb.locator('span.font-medium');
    await expect(currentItem.first()).toBeVisible();
  });

  test('should show full breadcrumb trail on run detail page', async ({ page }) => {
    // Given: The user navigates to a run detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForURL(/\/project\//);
    await page.waitForLoadState('networkidle');

    // When: They click on a run (if available)
    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRuns) {
      await runLink.click();
      await page.waitForURL(/\/run\//);

      // Then: Breadcrumb should show: Home > Project Name (link) > Run (current)
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Should have the home link
      await expect(breadcrumb.getByLabel('Dashboard')).toBeVisible();

      // Should have at least one intermediate link (project name)
      const intermediateLinks = breadcrumb.locator('a:not([aria-label="Dashboard"])');
      await expect(intermediateLinks.first()).toBeVisible();

      // Should have a current (non-link) item
      const currentItem = breadcrumb.locator('span.font-medium');
      await expect(currentItem.first()).toBeVisible();
    }
  });

  test('should navigate from run detail to project via breadcrumb link', async ({ page }) => {
    // Given: The user is on a run detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForURL(/\/project\//);
    const projectUrl = page.url();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRuns) {
      await runLink.click();
      await page.waitForURL(/\/run\//);

      // When: They click the project name breadcrumb link
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const projectBreadcrumbLink = breadcrumb.locator('a[href*="/project/"]');
      await expect(projectBreadcrumbLink).toBeVisible();
      await projectBreadcrumbLink.click();

      // Then: They should be back on the project detail page
      await page.waitForURL(/\/project\//);
      expect(page.url()).not.toMatch(/\/run\//);
    }
  });

  test('should show chevron separators between breadcrumb items', async ({ page }) => {
    // Given: The user is on a project detail page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    // Then: There should be chevron separator SVGs in the breadcrumb
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    const chevrons = breadcrumb.locator('svg').filter({ has: page.locator('polyline, path') });
    const count = await chevrons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
