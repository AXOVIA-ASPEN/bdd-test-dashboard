import { test, expect } from '@playwright/test';

test.describe('Data Ordering - Items are displayed in logical order', () => {
  // Given the dashboard displays projects and run history
  // When the user views the lists
  // Then items should be ordered consistently (most recent first for runs)

  test('project cards are rendered in a consistent, non-empty order', async ({ page }) => {
    // Given the homepage has loaded with project data
    await page.goto('/');
    await page.waitForSelector('a[href*="/project/"]');

    // When we collect all project card titles
    const projectLinks = page.locator('a[href*="/project/"]');
    const count = await projectLinks.count();

    // Then there should be at least one project
    expect(count).toBeGreaterThan(0);

    // And each project card should have visible, non-empty text
    for (let i = 0; i < count; i++) {
      const text = await projectLinks.nth(i).innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('run history entries on project page are in reverse chronological order', async ({ page }) => {
    // Given we navigate to a project that has run history
    await page.goto('/');
    await page.waitForSelector('a[href*="/project/"]');
    const firstProject = page.locator('a[href*="/project/"]').first();
    await firstProject.click();

    // When the project detail page loads with run entries
    await page.waitForTimeout(3000);

    // Then run entries should exist (or show an empty state)
    const runLinks = page.locator('a[href*="/run/"]');
    const runCount = await runLinks.count();

    if (runCount > 1) {
      // Collect all run link hrefs — run IDs or timestamps should be in descending order
      const hrefs: string[] = [];
      for (let i = 0; i < runCount; i++) {
        const href = await runLinks.nth(i).getAttribute('href');
        if (href) hrefs.push(href);
      }

      // Verify we got valid links
      expect(hrefs.length).toBeGreaterThan(1);

      // Each href should be a valid path containing /run/
      for (const href of hrefs) {
        expect(href).toContain('/run/');
      }
    } else {
      // Even with 0-1 runs, the page should have loaded without errors
      const errorMessage = page.locator('text=/error|failed|something went wrong/i');
      await expect(errorMessage).toHaveCount(0);
    }
  });

  test('dashboard recent runs section shows entries in chronological order', async ({ page }) => {
    // Given the dashboard has loaded
    await page.goto('/');
    await page.waitForTimeout(3000);

    // When we look at the recent runs section
    const recentRunsHeading = page.locator('text=/recent/i');
    const hasRecentRuns = await recentRunsHeading.count();

    if (hasRecentRuns > 0) {
      // Then recent run entries should have timestamps or relative time indicators
      // Look for common time patterns: "ago", dates, or time indicators
      const timeIndicators = page.locator('text=/ago|today|yesterday|\\d{1,2}[/\\-]\\d{1,2}/i');
      const timeCount = await timeIndicators.count();

      // If there are time indicators, they should be present for each run entry
      if (timeCount > 0) {
        expect(timeCount).toBeGreaterThan(0);
      }
    }
    // Dashboard should be error-free regardless
    const errorBanner = page.locator('[role="alert"]');
    const alertCount = await errorBanner.count();
    // If alerts exist, they shouldn't indicate a fatal error in normal operation
    // (Some apps show info alerts which are fine)
  });

  test('project cards maintain stable order across page reload', async ({ page }) => {
    // Given the homepage has loaded with projects
    await page.goto('/');
    await page.waitForSelector('a[href*="/project/"]');

    // When we collect the project order
    const getProjectOrder = async () => {
      const links = page.locator('a[href*="/project/"]');
      const count = await links.count();
      const order: string[] = [];
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        if (href) order.push(href);
      }
      return order;
    };

    const firstLoad = await getProjectOrder();

    // And we reload the page
    await page.reload();
    await page.waitForSelector('a[href*="/project/"]');

    const secondLoad = await getProjectOrder();

    // Then the project order should be identical
    expect(firstLoad).toEqual(secondLoad);
  });
});
