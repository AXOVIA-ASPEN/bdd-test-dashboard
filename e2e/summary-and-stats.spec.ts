import { test, expect } from '@playwright/test';

test.describe('Summary Cards & Statistics - Dashboard shows aggregate test metrics', () => {
  // BDD: Given the user visits the dashboard
  //      When the page loads with project data
  //      Then summary statistics cards should be visible

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the dashboard to fully load (projects appear)
    await page.waitForSelector('text=Projects', { timeout: 10000 });
  });

  test('should display all four summary metric cards', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: I look at the summary section
    // Then: I should see Total Tests, Pass Rate, Failures, and Skipped cards

    const labels = ['Total Tests', 'Pass Rate', 'Failures', 'Skipped'];
    for (const label of labels) {
      const card = page.locator(`text=${label}`);
      await expect(card).toBeVisible();
    }
  });

  test('should show numeric values in summary cards', async ({ page }) => {
    // Given: The dashboard has loaded with data
    // When: I inspect the summary cards
    // Then: Each card should contain a numeric value

    // Find the card grid (2x2 or 4-column grid of cards)
    const cards = page.locator('.grid >> .bg-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Each card should have a bold number
    for (let i = 0; i < 4; i++) {
      const value = cards.nth(i).locator('.text-3xl');
      await expect(value).toBeVisible();
      const text = await value.textContent();
      // Should contain a number (possibly with % suffix)
      expect(text).toMatch(/\d+/);
    }
  });

  test('should show Pass Rate as a percentage', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: I look at the Pass Rate card
    // Then: It should display a percentage value (e.g. "85%")

    const passRateCard = page.locator('.bg-card', { has: page.locator('text=Pass Rate') });
    await expect(passRateCard).toBeVisible();

    const value = passRateCard.locator('.text-3xl');
    const text = await value.textContent();
    expect(text).toMatch(/^\d+%$/);
  });

  test('should display summary cards in a responsive grid layout', async ({ page }) => {
    // Given: The dashboard has loaded on desktop
    // When: I check the summary card container
    // Then: Cards should be arranged in a grid

    const grid = page.locator('.grid.grid-cols-2');
    await expect(grid.first()).toBeVisible();
  });

  test('should show trend chart or visualization section', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: I scroll down past summary cards
    // Then: A trend chart or recent activity section should be visible

    // Look for canvas (chart.js/recharts) or SVG (recharts) or a chart container
    const chart = page.locator('canvas, svg.recharts-surface, [class*="chart"], [class*="trend"]').first();
    const recentRuns = page.locator('text=/recent|history|runs/i').first();

    // At least one of these should exist
    const hasChart = await chart.isVisible().catch(() => false);
    const hasRecentRuns = await recentRuns.isVisible().catch(() => false);
    expect(hasChart || hasRecentRuns).toBeTruthy();
  });
});
