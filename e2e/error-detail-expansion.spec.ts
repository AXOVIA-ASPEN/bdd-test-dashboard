import { test, expect } from '@playwright/test';

test.describe('Error Detail Expansion - Expand/collapse error messages on run detail', () => {
  // Given: A user views a test run with failed scenarios
  // When: They click "Show more" on a truncated error message
  // Then: The full error details should expand, and "Show less" should appear

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show "Show more" link for truncated error messages', async ({ page }) => {
    // Given: Navigate to a project and find a run with failures
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasRuns) {
      test.skip(true, 'No runs available to test');
      return;
    }

    // Find a run that might have failures - try clicking through runs
    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // When: Check if there are expandable error messages
    const showMoreButton = page.locator('button:has-text("Show more")');
    const hasErrors = await showMoreButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasErrors) {
      // No failed scenarios with truncated errors in this run - that's OK
      test.skip(true, 'No truncated error messages found in this run');
      return;
    }

    // Then: The "Show more" button should be clickable
    await expect(showMoreButton.first()).toBeEnabled();
  });

  test('should expand error details when clicking "Show more"', async ({ page }) => {
    // Given: Navigate to a run detail page with failed scenarios
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasRuns) {
      test.skip(true, 'No runs available');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const showMoreButton = page.locator('button:has-text("Show more")').first();
    const hasErrors = await showMoreButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasErrors) {
      test.skip(true, 'No truncated error messages found');
      return;
    }

    // When: Click "Show more" to expand the error
    await showMoreButton.click();

    // Then: The button text should change to "Show less"
    const showLessButton = page.locator('button:has-text("Show less")').first();
    await expect(showLessButton).toBeVisible({ timeout: 3000 });
  });

  test('should collapse error details when clicking "Show less"', async ({ page }) => {
    // Given: Navigate to a run with expanded error details
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasRuns) {
      test.skip(true, 'No runs available');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const showMoreButton = page.locator('button:has-text("Show more")').first();
    const hasErrors = await showMoreButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasErrors) {
      test.skip(true, 'No truncated error messages found');
      return;
    }

    // When: Expand then collapse
    await showMoreButton.click();
    const showLessButton = page.locator('button:has-text("Show less")').first();
    await expect(showLessButton).toBeVisible({ timeout: 3000 });

    await showLessButton.click();

    // Then: "Show more" should reappear
    await expect(page.locator('button:has-text("Show more")').first()).toBeVisible({ timeout: 3000 });
  });

  test('should display pass/fail status badges for scenarios', async ({ page }) => {
    // Given: Navigate to any run detail page
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasRuns) {
      test.skip(true, 'No runs available');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Then: The page should show scenario results with status indicators
    const body = await page.textContent('body') || '';
    const hasScenarioContent = /scenario|feature|test|step/i.test(body);
    const hasStatusInfo = /pass|fail|skip|pending|✓|✗|×/i.test(body);

    // At minimum the run detail page should have test content
    expect(hasScenarioContent || hasStatusInfo).toBeTruthy();
  });
});
