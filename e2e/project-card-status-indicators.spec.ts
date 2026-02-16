import { test, expect } from '@playwright/test';

test.describe('Project Card Status Indicators - Visual pass/fail/skip indicators', () => {
  // Given a user is on the dashboard homepage
  // When project cards are loaded with test run data
  // Then each card should display color-coded passed/failed/skipped counts
  // And a health badge indicating overall project health

  test('should display passed count in green on project cards', async ({ page }) => {
    // Given: the dashboard is loaded with project data
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we look at the first project card
    const firstCard = page.locator('a[href*="/project/"]').first();

    // Then: passed count should be visible with green styling
    const passedSpan = firstCard.locator('span:has-text("passed")').first();
    await expect(passedSpan).toBeVisible();

    // And: the text should contain the emerald/green color class
    const classes = await passedSpan.getAttribute('class');
    expect(classes).toMatch(/emerald|green/);
  });

  test('should display failed count in red on project cards', async ({ page }) => {
    // Given: the dashboard is loaded
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we examine project card status indicators
    const firstCard = page.locator('a[href*="/project/"]').first();

    // Then: failed count should be visible with red styling
    const failedSpan = firstCard.locator('span:has-text("failed")').first();
    await expect(failedSpan).toBeVisible();

    const classes = await failedSpan.getAttribute('class');
    expect(classes).toMatch(/red/);
  });

  test('should display skipped count in yellow on project cards', async ({ page }) => {
    // Given: the dashboard is loaded
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we examine project card status indicators
    const firstCard = page.locator('a[href*="/project/"]').first();

    // Then: skipped count should be visible with yellow styling
    const skippedSpan = firstCard.locator('span:has-text("skipped")').first();
    await expect(skippedSpan).toBeVisible();

    const classes = await skippedSpan.getAttribute('class');
    expect(classes).toMatch(/yellow/);
  });

  test('should show a health badge on project cards', async ({ page }) => {
    // Given: the dashboard is loaded with project data
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we look at the first project card
    const firstCard = page.locator('a[href*="/project/"]').first();

    // Then: a health badge should be visible (Healthy, Warning, or Failing)
    const healthBadge = firstCard.locator('text=/Healthy|Warning|Failing/i');
    await expect(healthBadge).toBeVisible({ timeout: 5000 });
  });

  test('should show all three status counts for every visible project card', async ({ page }) => {
    // Given: the dashboard is fully loaded
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: we check all visible project cards
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Then: each card should have passed, failed, and skipped indicators
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      await expect(card.locator('span:has-text("passed")')).toBeVisible();
      await expect(card.locator('span:has-text("failed")')).toBeVisible();
      await expect(card.locator('span:has-text("skipped")')).toBeVisible();
    }
  });
});
