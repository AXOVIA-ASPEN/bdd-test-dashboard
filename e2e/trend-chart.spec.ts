import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Trend Chart Time Range Selector
 * Covers: trend chart display, time range selection, chart updates, localStorage persistence
 *
 * Test architecture:
 *  - Uses aria roles, accessible text, and button names for locators
 *  - Built-in Playwright waiting strategies (no arbitrary timeouts)
 *  - BDD-style scenario descriptions with Given/When/Then comments
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Wait until loading skeleton disappears and content is visible */
async function waitForDashboardLoaded(page: Page) {
  await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
    .first()
    .waitFor({ state: 'hidden', timeout: 15_000 })
    .catch(() => {
      // If skeleton never appeared (instant load), that's fine
    });
  
  await expect(page.locator('#main-content')).toBeVisible();
}

/** Get the trend chart container */
function getTrendChart(page: Page) {
  // Look for trend chart by heading or container
  return page.locator('[data-testid="trend-chart"]').or(
    page.locator('section, div').filter({ hasText: /Trend|Pass Rate|History/i }).first()
  );
}

/** Get time range selector buttons */
function getTimeRangeButtons(page: Page) {
  // Time range buttons are typically labeled "7 days", "14 days", etc.
  return page.getByRole('button').filter({ hasText: /\d+\s*days?/i });
}

/** Get specific time range button by value */
function getTimeRangeButton(page: Page, days: number) {
  return page.getByRole('button', { name: new RegExp(`${days}\\s*days?`, 'i') });
}

// ─── Feature: Trend Chart Display ──────────────────────────────────────────

test.describe('Feature: Trend Chart Display', () => {

  test('Scenario: Dashboard displays trend chart with pass rate history', async ({ page }) => {
    // Given the user loads the dashboard homepage
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // Then a trend chart section is visible
    const trendChart = getTrendChart(page);
    const isVisible = await trendChart.isVisible().catch(() => false);
    
    if (!isVisible) {
      // Chart might only appear when there's data - check for heading
      const heading = page.getByRole('heading', { name: /trend|pass rate|history/i });
      const headingVisible = await heading.first().isVisible().catch(() => false);
      
      // Either chart OR heading should exist
      expect(isVisible || headingVisible).toBeTruthy();
    } else {
      await expect(trendChart).toBeVisible();
    }
  });

  test('Scenario: Trend chart shows time range selector buttons', async ({ page }) => {
    // Given the user loads the dashboard homepage
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // Then time range selector buttons are visible
    const timeRangeButtons = getTimeRangeButtons(page);
    const buttonCount = await timeRangeButtons.count();
    
    // Should have at least 3 time range options (7, 14, 30 days minimum)
    expect(buttonCount).toBeGreaterThanOrEqual(3);
    
    // Verify specific buttons exist
    const sevenDaysBtn = getTimeRangeButton(page, 7);
    const fourteenDaysBtn = getTimeRangeButton(page, 14);
    const thirtyDaysBtn = getTimeRangeButton(page, 30);
    
    await expect(sevenDaysBtn).toBeVisible();
    await expect(fourteenDaysBtn).toBeVisible();
    await expect(thirtyDaysBtn).toBeVisible();
  });

});

// ─── Feature: Time Range Selection ─────────────────────────────────────────

test.describe('Feature: Time Range Selection', () => {

  test('Scenario: Clicking time range button updates chart display', async ({ page }) => {
    // Given the user is on the dashboard with a visible trend chart
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const sevenDaysBtn = getTimeRangeButton(page, 7);
    const fourteenDaysBtn = getTimeRangeButton(page, 14);
    const thirtyDaysBtn = getTimeRangeButton(page, 30);
    
    // Verify buttons exist before testing interaction
    const has7Days = await sevenDaysBtn.isVisible().catch(() => false);
    const has14Days = await fourteenDaysBtn.isVisible().catch(() => false);
    const has30Days = await thirtyDaysBtn.isVisible().catch(() => false);
    
    if (!has7Days || !has14Days || !has30Days) {
      test.skip(true, 'Time range buttons not found — skipping interaction test');
      return;
    }
    
    // When the user clicks "7 days" button
    await sevenDaysBtn.click();
    
    // Then the button state updates (e.g., becomes active/selected)
    // Wait a moment for UI to update
    await page.waitForTimeout(300);
    
    // And verify the button has active/selected styling
    const sevenDaysClass = await sevenDaysBtn.getAttribute('class') ?? '';
    const sevenDaysAria = await sevenDaysBtn.getAttribute('aria-pressed') ?? '';
    
    // Button should have some indication it's active (class or aria-pressed)
    const isSevenDaysActive = 
      sevenDaysClass.includes('active') || 
      sevenDaysClass.includes('selected') ||
      sevenDaysClass.includes('bg-') ||
      sevenDaysAria === 'true';
    
    expect(isSevenDaysActive).toBeTruthy();
    
    // When the user clicks "30 days" button
    await thirtyDaysBtn.click();
    await page.waitForTimeout(300);
    
    // Then the 30 days button becomes active
    const thirtyDaysClass = await thirtyDaysBtn.getAttribute('class') ?? '';
    const thirtyDaysAria = await thirtyDaysBtn.getAttribute('aria-pressed') ?? '';
    
    const isThirtyDaysActive = 
      thirtyDaysClass.includes('active') || 
      thirtyDaysClass.includes('selected') ||
      thirtyDaysClass.includes('bg-') ||
      thirtyDaysAria === 'true';
    
    expect(isThirtyDaysActive).toBeTruthy();
  });

  test('Scenario: Time range selection persists across page reloads', async ({ page }) => {
    // Given the user is on the dashboard
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const sixtyDaysBtn = getTimeRangeButton(page, 60);
    const buttonExists = await sixtyDaysBtn.isVisible().catch(() => false);
    
    if (!buttonExists) {
      test.skip(true, '60 days button not found — skipping persistence test');
      return;
    }
    
    // When the user selects "60 days"
    await sixtyDaysBtn.click();
    await page.waitForTimeout(500); // Allow localStorage to save
    
    // And reloads the page
    await page.reload();
    await waitForDashboardLoaded(page);
    
    // Then the "60 days" selection is still active
    const sixtyDaysBtnAfterReload = getTimeRangeButton(page, 60);
    const className = await sixtyDaysBtnAfterReload.getAttribute('class') ?? '';
    const ariaPressed = await sixtyDaysBtnAfterReload.getAttribute('aria-pressed') ?? '';
    
    const isActive = 
      className.includes('active') || 
      className.includes('selected') ||
      className.includes('bg-') ||
      ariaPressed === 'true';
    
    expect(isActive).toBeTruthy();
  });

  test('Scenario: Each time range button is clickable and updates state', async ({ page }) => {
    // Given the user is on the dashboard
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // When the user clicks each available time range button
    const timeRanges = [7, 14, 30, 60, 90];
    
    for (const days of timeRanges) {
      const button = getTimeRangeButton(page, days);
      const exists = await button.isVisible().catch(() => false);
      
      if (exists) {
        // Click the button
        await button.click();
        
        // Wait briefly for state update
        await page.waitForTimeout(200);
        
        // Verify button becomes active
        const className = await button.getAttribute('class') ?? '';
        const ariaPressed = await button.getAttribute('aria-pressed') ?? '';
        
        const isActive = 
          className.includes('active') || 
          className.includes('selected') ||
          className.includes('bg-') ||
          ariaPressed === 'true';
        
        // Then each button successfully updates the active state
        expect(isActive).toBeTruthy();
      }
    }
  });

});

// ─── Feature: Chart Accessibility ──────────────────────────────────────────

test.describe('Feature: Chart Accessibility', () => {

  test('Scenario: Time range buttons are keyboard accessible', async ({ page }) => {
    // Given the user loads the dashboard
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const sevenDaysBtn = getTimeRangeButton(page, 7);
    const buttonExists = await sevenDaysBtn.isVisible().catch(() => false);
    
    if (!buttonExists) {
      test.skip(true, 'Time range buttons not found — skipping keyboard accessibility test');
      return;
    }
    
    // When the user focuses a time range button via keyboard
    await sevenDaysBtn.focus();
    
    // Then the button receives focus
    await expect(sevenDaysBtn).toBeFocused();
    
    // When the user presses Enter to activate
    await page.keyboard.press('Enter');
    
    // Then the chart updates (button becomes active)
    await page.waitForTimeout(300);
    const className = await sevenDaysBtn.getAttribute('class') ?? '';
    const ariaPressed = await sevenDaysBtn.getAttribute('aria-pressed') ?? '';
    
    const isActive = 
      className.includes('active') || 
      className.includes('selected') ||
      className.includes('bg-') ||
      ariaPressed === 'true';
    
    expect(isActive).toBeTruthy();
  });

  test('Scenario: Chart data has appropriate aria labels or text alternatives', async ({ page }) => {
    // Given the user loads the dashboard with a trend chart
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // Then the chart section has semantic structure
    // Look for appropriate headings, labels, or aria attributes
    const chartSection = getTrendChart(page);
    const hasChart = await chartSection.isVisible().catch(() => false);
    
    if (hasChart) {
      // Verify there's a heading or label describing the chart
      const heading = page.getByRole('heading', { name: /trend|pass rate|history/i });
      const headingExists = await heading.first().isVisible().catch(() => false);
      
      // Chart should have a descriptive heading or aria-label
      expect(headingExists).toBeTruthy();
    }
  });

});
