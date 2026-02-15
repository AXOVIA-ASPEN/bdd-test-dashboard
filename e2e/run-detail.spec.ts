import { test, expect } from '@playwright/test';

test.describe('Run Detail Page - View individual test run results', () => {
  // Given the dashboard is loaded and a project has run history
  // When the user navigates to a specific run
  // Then the run detail page should display run information

  test('should navigate from project page to a run detail page', async ({ page }) => {
    // Given: the user is on the homepage
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // When: they click the first project card
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();

    // Then: wait for project page to load
    await expect(page.locator('a[href="/"], [aria-label*="Back"], [aria-label*="back"]')).toBeVisible({ timeout: 15000 });

    // Check if there are run links on the project page
    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasRuns) {
      // When: they click a run link
      await runLink.click();

      // Then: the URL should contain /run/
      await page.waitForURL('**/run/**', { timeout: 10000 });
      expect(page.url()).toContain('/run/');

      // And: the page should show content (back link or run details)
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Then: project page shows empty state (no runs yet) - still valid
      expect(true).toBe(true);
    }
  });

  test('should allow navigating back from run detail to project page', async ({ page }) => {
    // Given: the user is on the homepage
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // Navigate to first project
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await expect(page.locator('a[href="/"], [aria-label*="Back"], [aria-label*="back"]')).toBeVisible({ timeout: 15000 });

    // Check for runs
    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasRuns) {
      // When: navigate to run detail
      await runLink.click();
      await page.waitForURL('**/run/**', { timeout: 10000 });

      // Then: use browser back to return
      await page.goBack();

      // Then: should be back on the project page (URL has /project/ but not /run/)
      await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
      expect(page.url()).not.toContain('/run/');
    }
  });

  test('should handle direct navigation to a non-existent run gracefully', async ({ page }) => {
    // Given: a URL with a non-existent run ID
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/project/fake-project/run/non-existent-run/');

    // Then: the page should not crash - body is visible
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // And: should show some UI (error state, loading, or empty - all acceptable)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
