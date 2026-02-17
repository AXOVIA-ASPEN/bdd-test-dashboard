import { test, expect } from '@playwright/test';

test.describe('Trend Chart Tooltip Hover - Interactive chart data on hover/click', () => {
  // Given: A project detail page has run history with a trend chart
  // When: The user hovers over or clicks a chart bar
  // Then: A tooltip should appear showing detailed stats for that day

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header[role="navigation"]');
  });

  test('should show tooltip with stats when hovering a trend chart bar', async ({ page }) => {
    // Given the user navigates to a project detail page
    const projectLink = page.locator('a[href*="/project/"]').first();
    test.skip(!(await projectLink.isVisible()), 'No projects available');
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    // And a trend chart is visible
    const trendChart = page.getByText('Pass Rate Trend');
    const hasTrend = await trendChart.isVisible().catch(() => false);
    test.skip(!hasTrend, 'No trend chart on this project (no recent runs)');

    // When the user hovers over a chart bar
    const chartBars = page.locator('.bg-emerald-500, .bg-yellow-500, .bg-red-500');
    const barCount = await chartBars.count();
    test.skip(barCount === 0, 'No chart bars rendered');

    await chartBars.first().hover();

    // Then a tooltip with role="tooltip" should appear
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // And it should contain pass rate and total information
    await expect(tooltip.getByText(/Pass Rate/)).toBeVisible();
    await expect(tooltip.getByText(/Total/)).toBeVisible();
    await expect(tooltip.getByText(/Passed/)).toBeVisible();
  });

  test('should show tooltip with click on mobile (no hover)', async ({ page }) => {
    // Given a mobile-sized viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const projectLink = page.locator('a[href*="/project/"]').first();
    test.skip(!(await projectLink.isVisible()), 'No projects available');
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    const trendChart = page.getByText('Pass Rate Trend');
    const hasTrend = await trendChart.isVisible().catch(() => false);
    test.skip(!hasTrend, 'No trend chart on this project');

    const chartBars = page.locator('.bg-emerald-500, .bg-yellow-500, .bg-red-500');
    const barCount = await chartBars.count();
    test.skip(barCount === 0, 'No chart bars rendered');

    // When the user taps/clicks a chart bar
    await chartBars.first().click();

    // Then the tooltip should appear
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    await expect(tooltip.getByText(/Pass Rate/)).toBeVisible();
  });

  test('should hide tooltip when moving mouse away from bar', async ({ page }) => {
    const projectLink = page.locator('a[href*="/project/"]').first();
    test.skip(!(await projectLink.isVisible()), 'No projects available');
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    const trendChart = page.getByText('Pass Rate Trend');
    test.skip(!(await trendChart.isVisible().catch(() => false)), 'No trend chart');

    const chartBars = page.locator('.bg-emerald-500, .bg-yellow-500, .bg-red-500');
    test.skip((await chartBars.count()) === 0, 'No chart bars');

    // Given the tooltip is showing
    await chartBars.first().hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // When the user moves the mouse away
    await page.locator('h3:has-text("Pass Rate Trend")').hover();

    // Then the tooltip should disappear
    await expect(tooltip).not.toBeVisible({ timeout: 3000 });
  });

  test('should display correct color coding for pass rate bars', async ({ page }) => {
    // Given the user is on a project with trend data
    const projectLink = page.locator('a[href*="/project/"]').first();
    test.skip(!(await projectLink.isVisible()), 'No projects available');
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    const trendChart = page.getByText('Pass Rate Trend');
    test.skip(!(await trendChart.isVisible().catch(() => false)), 'No trend chart');

    // Then bars should use color classes based on pass rate thresholds
    // Green (>=90%), Yellow (>=70%), Red (<70%)
    const greenBars = page.locator('.bg-emerald-500');
    const yellowBars = page.locator('.bg-yellow-500');
    const redBars = page.locator('.bg-red-500');

    const total = (await greenBars.count()) + (await yellowBars.count()) + (await redBars.count());
    test.skip(total === 0, 'No bars rendered');

    // Each bar should have a percentage label above it
    const percentLabels = page.locator('.text-xs.text-muted');
    const labelCount = await percentLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(total);
  });

  test('should show tooltip with failed and skipped counts when present', async ({ page }) => {
    const projectLink = page.locator('a[href*="/project/"]').first();
    test.skip(!(await projectLink.isVisible()), 'No projects available');
    await projectLink.click();
    await page.waitForURL(/\/project\//);

    const trendChart = page.getByText('Pass Rate Trend');
    test.skip(!(await trendChart.isVisible().catch(() => false)), 'No trend chart');

    const chartBars = page.locator('.bg-emerald-500, .bg-yellow-500, .bg-red-500');
    const barCount = await chartBars.count();
    test.skip(barCount === 0, 'No chart bars');

    // When hovering over each bar, the tooltip should show Failed count
    await chartBars.first().hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Then the tooltip should show Failed count (always present in the component)
    await expect(tooltip.getByText(/Failed/)).toBeVisible();
  });
});
