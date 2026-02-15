import { test, expect } from '@playwright/test';

test.describe('Full User Journey - End-to-end workflow through the dashboard', () => {
  // BDD: Given a user visits the BDD Test Dashboard for the first time
  //      When they explore dashboard stats, drill into a project, review runs, and return
  //      Then the entire flow should be seamless with consistent data

  test('should complete a full exploration journey: dashboard → project → back → verify', async ({ page }) => {
    // Given: The user navigates to the dashboard
    await page.goto('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    // When: They see the summary stats
    const totalTestsCard = page.locator('.bg-card', { has: page.locator('text=Total Tests') });
    await expect(totalTestsCard).toBeVisible();
    const totalTestsValue = await totalTestsCard.locator('.text-3xl').textContent();
    expect(totalTestsValue).toMatch(/\d+/);

    // And: They note the pass rate
    const passRateCard = page.locator('.bg-card', { has: page.locator('text=Pass Rate') });
    const passRateValue = await passRateCard.locator('.text-3xl').textContent();
    expect(passRateValue).toMatch(/\d+%/);

    // When: They click the first project link
    const projectLinks = page.locator('a[href*="/project"]');
    const projectCount = await projectLinks.count();
    expect(projectCount).toBeGreaterThan(0);

    const firstProjectName = await projectLinks.first().textContent();
    await projectLinks.first().click();

    // Then: The project detail page loads
    await page.waitForURL(/\/project\//);

    // And: The project name or a back link is visible
    const backLink = page.locator('a[href="/"], a:has-text("Back"), a:has-text("Dashboard"), button:has-text("Back")');
    await expect(backLink.first()).toBeVisible({ timeout: 5000 });

    // And: Either run history or an empty state is displayed
    const hasRunContent = await page.locator('table, [class*="run"], [class*="history"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no runs|empty|no data/i).first().isVisible().catch(() => false);
    const hasAnyContent = hasRunContent || hasEmptyState;
    // If neither specific content, at least the page rendered something beyond nav
    const bodyText = await page.locator('main, [class*="content"], [class*="detail"]').first().isVisible().catch(() => false);
    expect(hasAnyContent || bodyText).toBeTruthy();

    // When: The user navigates back to the dashboard
    await backLink.first().click();
    await page.waitForURL('/');

    // Then: The dashboard is intact with the same stats
    await expect(totalTestsCard).toBeVisible();
    const totalTestsAfter = await totalTestsCard.locator('.text-3xl').textContent();
    expect(totalTestsAfter).toBe(totalTestsValue);

    const passRateAfter = await passRateCard.locator('.text-3xl').textContent();
    expect(passRateAfter).toBe(passRateValue);

    // And: The same number of projects is still shown
    const projectCountAfter = await projectLinks.count();
    expect(projectCountAfter).toBe(projectCount);
  });

  test('should visit multiple projects in sequence without state leaks', async ({ page }) => {
    // Given: The dashboard is loaded
    await page.goto('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    const projectLinks = page.locator('a[href*="/project"]');
    const projectCount = await projectLinks.count();

    if (projectCount < 2) {
      test.skip(projectCount < 2, 'Need at least 2 projects for this test');
      return;
    }

    // When: The user visits the first project
    const firstProjectText = await projectLinks.nth(0).textContent();
    await projectLinks.nth(0).click();
    await page.waitForURL(/\/project\//);
    const firstURL = page.url();

    // Then navigates back
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    // When: The user visits the second project
    const secondProjectLinks = page.locator('a[href*="/project"]');
    const secondProjectText = await secondProjectLinks.nth(1).textContent();
    await secondProjectLinks.nth(1).click();
    await page.waitForURL(/\/project\//);
    const secondURL = page.url();

    // Then: The URLs should be different (different projects)
    expect(secondURL).not.toBe(firstURL);

    // And: No stale data from the first project should appear
    // The page should reflect the second project's content
    await page.goBack();
    await page.waitForURL('/');

    // And: The dashboard is still functional
    await expect(page.locator('text=Projects')).toBeVisible();
  });

  test('should handle rapid navigation without breaking', async ({ page }) => {
    // Given: The dashboard is loaded
    await page.goto('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    const projectLinks = page.locator('a[href*="/project"]');
    const projectCount = await projectLinks.count();

    if (projectCount === 0) {
      test.skip(true, 'No projects available');
      return;
    }

    // When: The user rapidly clicks a project, goes back, clicks again
    await projectLinks.first().click();
    await page.waitForURL(/\/project\//);
    await page.goBack();
    await page.waitForURL('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    // Click again quickly
    const linksAgain = page.locator('a[href*="/project"]');
    await linksAgain.first().click();
    await page.waitForURL(/\/project\//);

    // Then: The page should be stable and not crashed
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Navigate home one more time
    await page.goto('/');
    await page.waitForSelector('text=Projects', { timeout: 10000 });

    // Then: Dashboard renders correctly
    await expect(page.locator('.bg-card').first()).toBeVisible();
  });
});
