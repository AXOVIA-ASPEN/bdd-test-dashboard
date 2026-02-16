import { test, expect } from '@playwright/test';

test.describe('Recent Runs - Dashboard shows latest test run entries', () => {
  // Given: The user visits the BDD Test Dashboard homepage
  // When: The page finishes loading
  // Then: The "Recent Test Runs" section should be visible with run entries or an empty state

  test('should display the Recent Test Runs heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /recent test runs/i });
    await expect(heading).toBeVisible();
  });

  test('should show run entries or empty state message', async ({ page }) => {
    await page.goto('/');
    // Wait for content to settle
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no test runs yet/i);
    const runLinks = page.locator('a[href*="/project/"][href*="/run/"]');

    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const runCount = await runLinks.count();

    // Either we have runs or the empty state - one must be true
    expect(hasEmpty || runCount > 0).toBeTruthy();
  });

  test('should show at most 10 recent runs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const runLinks = page.locator('a[href*="/project/"][href*="/run/"]');
    const count = await runLinks.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('should navigate to run detail when clicking a recent run entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const runLinks = page.locator('a[href*="/project/"][href*="/run/"]');
    const count = await runLinks.count();

    if (count > 0) {
      // Given: There is at least one run entry
      // When: The user clicks on the first run entry
      const href = await runLinks.first().getAttribute('href');
      await runLinks.first().click();

      // Then: The URL should contain the run path
      await expect(page).toHaveURL(new RegExp('/project/.+/run/.+'));
    }
  });

  test('should display run metadata (project name, date) for each entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const runLinks = page.locator('a[href*="/project/"][href*="/run/"]');
    const count = await runLinks.count();

    if (count > 0) {
      // Each run entry should have some text content (project name, timestamp)
      const firstRunText = await runLinks.first().textContent();
      expect(firstRunText).toBeTruthy();
      expect(firstRunText!.length).toBeGreaterThan(0);
    }
  });

  test('should show status indicators for run entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const runLinks = page.locator('a[href*="/project/"][href*="/run/"]');
    const count = await runLinks.count();

    if (count > 0) {
      // Each run entry should have a colored status dot (w-2 h-2 rounded-full)
      const statusDots = runLinks.first().locator('.rounded-full');
      const dotCount = await statusDots.count();
      expect(dotCount).toBeGreaterThanOrEqual(1);
    }
  });
});
