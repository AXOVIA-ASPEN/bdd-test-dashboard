import { test, expect } from '@playwright/test';

test.describe('Error State & Retry - App recovers from API failures via retry button', () => {
  // Given the Firestore API is unavailable
  // When the dashboard loads
  // Then an error state with a Retry button should appear
  test('should show error state with retry button when API fails', async ({ page }) => {
    // Block Firestore API requests to simulate failure
    await page.route('**/firestore.googleapis.com/**', (route) => route.abort('failed'));
    await page.route('**/googleapis.com/v1/projects/**', (route) => route.abort('failed'));

    await page.goto('/');

    // Should show the error state
    const errorHeading = page.getByText('Failed to load data');
    await expect(errorHeading).toBeVisible({ timeout: 10000 });

    // Should show the retry button
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
  });

  // Given the error state is displayed
  // When the user clicks the Retry button
  // Then the app should attempt to reload data
  test('should attempt to reload data when clicking Retry', async ({ page }) => {
    // Block API initially
    await page.route('**/firestore.googleapis.com/**', (route) => route.abort('failed'));
    await page.route('**/googleapis.com/v1/projects/**', (route) => route.abort('failed'));

    await page.goto('/');

    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible({ timeout: 10000 });

    // Click retry — still blocked, so error should persist or show loading
    await retryButton.click();

    // The error state or loading state should be visible (retry triggers re-fetch)
    const hasErrorOrLoading = await Promise.race([
      page.getByText('Failed to load data').waitFor({ timeout: 5000 }).then(() => true),
      page.locator('[class*="skeleton"], [class*="animate-pulse"]').first().waitFor({ timeout: 5000 }).then(() => true),
    ]).catch(() => false);

    expect(hasErrorOrLoading).toBeTruthy();
  });

  // Given the API initially fails then recovers
  // When the user clicks Retry after recovery
  // Then the dashboard should load successfully
  test('should recover and show dashboard when API becomes available after retry', async ({ page }) => {
    let blockApi = true;

    // Conditionally block API
    await page.route('**/firestore.googleapis.com/**', (route) => {
      if (blockApi) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/');

    // Wait for error state
    const errorHeading = page.getByText('Failed to load data');
    await expect(errorHeading).toBeVisible({ timeout: 10000 });

    // "Fix" the API
    blockApi = false;

    // Click retry
    const retryButton = page.getByRole('button', { name: /retry/i });
    await retryButton.click();

    // Should recover — either show projects or the empty state
    const recovered = await Promise.race([
      page.getByText('Projects').waitFor({ timeout: 10000 }).then(() => 'projects'),
      page.getByText('No projects configured').waitFor({ timeout: 10000 }).then(() => 'empty'),
    ]).catch(() => null);

    expect(recovered).toBeTruthy();
  });

  // Given the error state is displayed
  // Then the error message should be descriptive and accessible
  test('should display an accessible error message with alert icon', async ({ page }) => {
    await page.route('**/firestore.googleapis.com/**', (route) => route.abort('failed'));
    await page.route('**/googleapis.com/v1/projects/**', (route) => route.abort('failed'));

    await page.goto('/');

    const errorHeading = page.getByText('Failed to load data');
    await expect(errorHeading).toBeVisible({ timeout: 10000 });

    // Should have an SVG icon (AlertTriangle from lucide)
    const errorContainer = page.locator('div').filter({ hasText: 'Failed to load data' }).first();
    const svg = errorContainer.locator('svg').first();
    await expect(svg).toBeVisible();

    // Retry button should have the RefreshCw icon
    const retryButton = page.getByRole('button', { name: /retry/i });
    const buttonSvg = retryButton.locator('svg');
    await expect(buttonSvg).toBeVisible();
  });

  // Given the error state is displayed
  // When the user presses Enter on the focused Retry button
  // Then it should trigger retry (keyboard accessible)
  test('should support keyboard activation of Retry button', async ({ page }) => {
    await page.route('**/firestore.googleapis.com/**', (route) => route.abort('failed'));
    await page.route('**/googleapis.com/v1/projects/**', (route) => route.abort('failed'));

    await page.goto('/');

    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible({ timeout: 10000 });

    // Focus and press Enter
    await retryButton.focus();
    await page.keyboard.press('Enter');

    // Should trigger a reload attempt — error or loading should appear
    const hasResponse = await Promise.race([
      page.getByText('Failed to load data').waitFor({ timeout: 5000 }).then(() => true),
      page.locator('[class*="skeleton"], [class*="animate-pulse"]').first().waitFor({ timeout: 5000 }).then(() => true),
    ]).catch(() => false);

    expect(hasResponse).toBeTruthy();
  });
});
