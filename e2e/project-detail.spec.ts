import { test, expect } from '@playwright/test';

test.describe('Project Detail Page - Run history and content', () => {
  // Given a user navigates to a project detail page
  // When the page loads
  // Then they should see the project name, run history or empty state,
  // And a back link to the dashboard

  test('should display project name on detail page', async ({ page }) => {
    // Given: user is on the homepage
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });

    // Capture the project name from the card
    const projectName = await projectLink.locator('h4').innerText();

    // When: they click through to the project
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Then: the project name should appear on the detail page
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });
  });

  test('should show a back link to the dashboard', async ({ page }) => {
    // Given: user is on a project detail page
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Then: a back link pointing to "/" should be visible
    const backLink = page.locator('a[href="/"]');
    await expect(backLink.first()).toBeVisible({ timeout: 15000 });

    // When: they click back
    await backLink.first().click();

    // Then: they return to the dashboard
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
  });

  test('should show run history table/list or empty state', async ({ page }) => {
    // Given: user navigates to a project detail page
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Wait for content to load (back link signals page is rendered)
    await expect(page.locator('a[href="/"]').first()).toBeVisible({ timeout: 15000 });

    // Then: should show either run history content or an empty/no-runs state
    // Possible indicators: table rows, "No runs", "Run History", timestamps, status badges
    const runHistory = page.getByText('Run History', { exact: false });
    const noRuns = page.getByText(/no runs|no test runs|no results|empty/i);
    const tableRows = page.locator('table tbody tr, [data-testid="run-row"]');
    const runCards = page.locator('[class*="run"], [class*="card"]').filter({ hasText: /pass|fail|pending/i });

    // At least one indicator of run history section should be present
    const hasRunHistory = await runHistory.count() > 0;
    const hasNoRuns = await noRuns.count() > 0;
    const hasRows = await tableRows.count() > 0;
    const hasRunCards = await runCards.count() > 0;

    // The page should show something meaningful about runs
    expect(hasRunHistory || hasNoRuns || hasRows || hasRunCards).toBe(true);
  });

  test('should handle direct navigation to a non-existent project gracefully', async ({ page }) => {
    // Given: a user navigates directly to a project that doesn't exist
    const response = await page.goto('/project/does-not-exist-999');

    // Then: the page should still load (not crash with 5xx)
    expect(response?.status()).toBeLessThan(500);

    // And: some UI should render (the SPA shell at minimum)
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
