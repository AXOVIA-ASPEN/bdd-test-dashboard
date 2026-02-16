import { test, expect } from '@playwright/test';

test.describe('Network Resilience - App handles API failures gracefully', () => {
  // Given: The BDD Dashboard depends on Firestore/API data
  // When: Network requests fail
  // Then: The app should degrade gracefully without crashing

  test('should render app shell when Firestore API is blocked', async ({ page }) => {
    // Given: All Firestore API calls are blocked
    await page.route('**/*.googleapis.com/**', (route) => route.abort());

    // When: The user navigates to the homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Then: The app shell (header/nav) should still render
    const header = page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // And: The page should not be blank
    const body = await page.textContent('body');
    expect(body?.trim().length).toBeGreaterThan(0);
  });

  test('should keep theme toggle functional when API is down', async ({ page }) => {
    // Given: All API calls are blocked
    await page.route('**/*.googleapis.com/**', (route) => route.abort());

    // When: The user loads the page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Then: Client-side features like theme toggle should still work
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|moon|sun/i }).first();
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    const htmlBefore = await page.locator('html').getAttribute('class') ?? '';
    await themeToggle.click();
    const htmlAfter = await page.locator('html').getAttribute('class') ?? '';
    expect(htmlAfter).not.toBe(htmlBefore);
  });

  test('should recover when network is restored after failure', async ({ page }) => {
    // Given: API calls are blocked and page loaded in degraded state
    await page.route('**/*.googleapis.com/**', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // When: Network is restored and user refreshes
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Then: Data should load - heading visible
    const heading = page.locator('h1, [role="heading"]').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should not throw uncaught exceptions on 500 API errors', async ({ page }) => {
    // Given: We track uncaught page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // When: API calls return 500 errors
    await page.route('**/*.googleapis.com/**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for any async error handlers
    await page.waitForTimeout(3000);

    // Then: There should be no uncaught exceptions
    expect(pageErrors).toEqual([]);
  });

  test('should handle navigating to project page when API is down', async ({ page }) => {
    // Given: The homepage loads normally first
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // When: API goes down and user clicks a project
    await page.route('**/*.googleapis.com/**', (route) => route.abort());

    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Then: The page should still render without crashing
      const body = await page.textContent('body');
      expect(body?.trim().length).toBeGreaterThan(0);

      // And: Navigation back should work
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      const backBody = await page.textContent('body');
      expect(backBody?.trim().length).toBeGreaterThan(0);
    }
  });
});
