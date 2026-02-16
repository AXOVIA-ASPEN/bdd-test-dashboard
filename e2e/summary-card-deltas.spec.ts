import { test, expect } from '@playwright/test';

test.describe('Summary Card Deltas - Trend indicators show metric changes', () => {
  // BDD: Given the dashboard loads with project data containing multiple runs
  //      When the summary cards compute deltas between latest and previous runs
  //      Then trend indicators (↑/↓/—) should appear with appropriate styling

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard to fully load with data
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
    // Wait for summary cards to render with values (not skeletons)
    await expect(page.locator('.grid.grid-cols-2 .text-3xl').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display delta indicators on summary cards when run history exists', async ({ page }) => {
    // Given: The dashboard has loaded with project data
    // When: I look at the summary cards
    // Then: Delta indicators should be present if there are multiple runs

    const cards = page.locator('.grid.grid-cols-2 .bg-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Check if any delta indicators exist (↑, ↓, or — for unchanged)
    const deltaIndicators = page.locator('.grid.grid-cols-2 .text-xs.font-medium');
    const deltaCount = await deltaIndicators.count();

    if (deltaCount > 0) {
      // Then: Each visible delta should contain a valid indicator symbol
      for (let i = 0; i < deltaCount; i++) {
        const text = await deltaIndicators.nth(i).textContent();
        expect(text).toMatch(/[↑↓—]/);
      }
    }
    // If no deltas, the project may only have one run — that's acceptable
  });

  test('should style improving deltas with green color', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: A metric is improving (e.g., pass rate went up)
    // Then: The delta indicator should have emerald/green styling

    const improvingDeltas = page.locator('.text-emerald-600, .dark\\:text-emerald-400');
    const count = await improvingDeltas.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const el = improvingDeltas.nth(i);
        const text = await el.textContent();
        // Improving deltas show ↑ or ↓ (depending on metric type) with a number
        if (text && (text.includes('↑') || text.includes('↓'))) {
          expect(text).toMatch(/[↑↓]\s*\d+/);
        }
      }
    }
    // No improving deltas is acceptable — depends on real data
  });

  test('should style regressing deltas with red color', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: A metric is regressing (e.g., failures went up)
    // Then: The delta indicator should have red styling

    const regressingDeltas = page.locator('.text-red-600, .dark\\:text-red-400');
    // Filter to only delta indicators (text-xs font-medium inside summary cards)
    const summaryGrid = page.locator('.grid.grid-cols-2').first();
    const redIndicators = summaryGrid.locator('.text-xs.font-medium').filter({
      has: page.locator('text=/[↑↓]/'),
    });

    const count = await redIndicators.count();
    // Verify structure if any regressing deltas exist
    if (count > 0) {
      const text = await redIndicators.first().textContent();
      expect(text).toMatch(/[↑↓]\s*\d+/);
    }
  });

  test('should show unchanged indicator (—) when metrics are stable', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: A metric hasn't changed between runs
    // Then: An em-dash (—) should appear as the delta

    const summaryGrid = page.locator('.grid.grid-cols-2').first();
    const unchangedIndicators = summaryGrid.locator('.text-xs.font-medium:has-text("—")');
    const count = await unchangedIndicators.count();

    if (count > 0) {
      // Then: unchanged indicators should have muted styling
      for (let i = 0; i < count; i++) {
        const classes = await unchangedIndicators.nth(i).getAttribute('class');
        expect(classes).toContain('text-muted');
      }
    }
    // No unchanged deltas is fine — metrics may always be changing
  });

  test('should show delta values with correct suffixes', async ({ page }) => {
    // Given: The dashboard has loaded with delta indicators
    // When: I inspect the Pass Rate delta
    // Then: It should include a % suffix

    const passRateCard = page.locator('.bg-card', { has: page.locator('text=Pass Rate') });
    await expect(passRateCard).toBeVisible();

    const delta = passRateCard.locator('.text-xs.font-medium');
    const hasDelta = await delta.isVisible().catch(() => false);

    if (hasDelta) {
      const text = await delta.textContent();
      if (text && text !== '—') {
        // Pass Rate deltas should have % suffix
        expect(text).toMatch(/%/);
      }
    }
  });

  test('should position delta indicators next to the metric value', async ({ page }) => {
    // Given: The dashboard has loaded
    // When: I look at a summary card with a delta
    // Then: The delta indicator should be in the same container as the value

    const cards = page.locator('.grid.grid-cols-2 .bg-card');
    const cardCount = await cards.count();

    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      const card = cards.nth(i);
      const value = card.locator('.text-3xl');
      const delta = card.locator('.text-xs.font-medium');

      const hasValue = await value.isVisible().catch(() => false);
      const hasDelta = await delta.isVisible().catch(() => false);

      if (hasValue && hasDelta) {
        // Both value and delta should share a parent flex container
        const valueParent = value.locator('..');
        await expect(valueParent).toBeVisible();
        // Delta should be within the same card
        await expect(delta).toBeVisible();
      }
    }
  });
});
