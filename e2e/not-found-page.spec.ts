import { test, expect } from '@playwright/test';

test.describe('404 Not Found Page - User sees helpful guidance on invalid routes', () => {
  // Given a user navigates to a URL that does not match any route
  // When the 404 page renders
  // Then they should see a clear message and a link back to the dashboard

  test('should display 404 heading and descriptive message', async ({ page }) => {
    // Given a user navigates to a non-existent route
    await page.goto('/completely-invalid-path-12345');

    // Then the page should show "404"
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

    // And show "Page Not Found"
    await expect(page.getByText('Page Not Found')).toBeVisible();

    // And show a helpful description
    await expect(
      page.getByText(/doesn.t exist|may have been moved/i),
    ).toBeVisible();
  });

  test('should have a link back to the dashboard', async ({ page }) => {
    // Given a user is on the 404 page
    await page.goto('/some-random-nonexistent-page');
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

    // Then there should be a "Back to Dashboard" link
    const backLink = page.getByRole('link', { name: /back to dashboard/i });
    await expect(backLink).toBeVisible();

    // When the user clicks the link
    await backLink.click();

    // Then they should be navigated to the homepage
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
  });

  test('should display the FileQuestion icon', async ({ page }) => {
    // Given a user is on the 404 page
    await page.goto('/nonexistent-route-xyz');
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

    // Then the page should contain an SVG icon (FileQuestion from lucide)
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('should maintain theme on 404 page', async ({ page }) => {
    // Given the user has the default theme
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const htmlClass = await page.locator('html').getAttribute('class');

    // When they navigate to a 404 page
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });

    // Then the theme class should be preserved
    const notFoundHtmlClass = await page.locator('html').getAttribute('class');
    expect(notFoundHtmlClass).toBe(htmlClass);
  });
});
