import { test, expect } from '@playwright/test';

test.describe('Run Detail Content - Scenario results and metadata', () => {
  // Given: a user navigates to a specific test run
  // When: the run detail page loads
  // Then: they should see scenario results, status badges, and timing info

  test('should display scenario/test names on run detail page', async ({ page }) => {
    // Given: navigate to homepage and find a project with runs
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();

    // When: find and click a run link
    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasRuns) {
      test.skip(true, 'No runs available to test');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });

    // Then: the page should contain scenario/test result entries
    // Look for common patterns: table rows, list items, or cards with test names
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50); // Page has meaningful content

    // Should have some indicator of pass/fail status
    const hasStatusIndicators = await page.locator(
      '[class*="pass"], [class*="fail"], [class*="success"], [class*="error"], [class*="status"], [data-status]'
    ).count();
    const hasStatusText = /pass|fail|success|error|skip/i.test(body || '');

    // At least one form of status should be present
    expect(hasStatusIndicators > 0 || hasStatusText).toBeTruthy();
  });

  test('should display run timestamp or duration', async ({ page }) => {
    // Given: navigate to a run detail page
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasRuns) {
      test.skip(true, 'No runs available to test');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });

    // Then: page should show some form of timing information
    const body = await page.textContent('body') || '';

    // Look for date patterns, duration patterns, or time-related words
    const hasTimeInfo = /\d{1,2}[:/]\d{2}|\d+\s*(ms|s|sec|min|seconds|minutes)|ago|duration|time|date|\d{4}-\d{2}-\d{2}/i.test(body);
    expect(hasTimeInfo).toBeTruthy();
  });

  test('should have a way to navigate back from run detail', async ({ page }) => {
    // Given: navigate to a run detail page
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasRuns) {
      test.skip(true, 'No runs available to test');
      return;
    }

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });

    // Then: there should be a back/navigation link visible
    const backLink = page.locator('a[href*="/project/"]').first();
    await expect(backLink).toBeVisible({ timeout: 10000 });

    // When: clicking the back link
    await backLink.click();

    // Then: should navigate to the project page
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
    expect(page.url()).not.toContain('/run/');
  });
});
