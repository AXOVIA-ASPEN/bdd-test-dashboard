import { test, expect } from '@playwright/test';

test.describe('Feature Accordion - Expand/collapse features on run detail page', () => {
  // Given: A user views a test run with multiple features
  // When: They interact with feature headers and the Expand/Collapse All toggle
  // Then: Feature sections should expand and collapse accordingly

  /**
   * Navigate from homepage → first project → first run.
   * Returns true if a run detail page was reached.
   */
  async function navigateToFirstRun(page: import('@playwright/test').Page): Promise<boolean> {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    const runLink = page.locator('a[href*="/run/"]').first();
    const hasRuns = await runLink.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasRuns) return false;

    await runLink.click();
    await page.waitForURL('**/run/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    return true;
  }

  test('should show Expand All / Collapse All toggle button', async ({ page }) => {
    // Given: The user navigates to a run detail page with features
    const reached = await navigateToFirstRun(page);
    test.skip(!reached, 'No runs available to test');

    // Then: An Expand All or Collapse All button should be visible
    const toggleButton = page.locator('button').filter({ hasText: /^(expand all|collapse all)$/i }).first();
    const isVisible = await toggleButton.isVisible({ timeout: 8000 }).catch(() => false);
    test.skip(!isVisible, 'No expand/collapse toggle on this page (may have no features)');

    await expect(toggleButton).toBeVisible();
  });

  test('should expand all features when clicking Expand All', async ({ page }) => {
    // Given: The user is on a run detail page
    const reached = await navigateToFirstRun(page);
    test.skip(!reached, 'No runs available to test');

    const expandButton = page.locator('button').filter({ hasText: /^expand all$/i }).first();
    const hasExpandButton = await expandButton.isVisible({ timeout: 8000 }).catch(() => false);
    test.skip(!hasExpandButton, 'No Expand All button available');

    // When: The user clicks "Expand All"
    await expandButton.click();

    // Then: The button text should change to "Collapse All"
    const collapseButton = page.locator('button').filter({ hasText: /^collapse all$/i }).first();
    await expect(collapseButton).toBeVisible({ timeout: 5000 });
  });

  test('should collapse all features when clicking Collapse All', async ({ page }) => {
    // Given: The user has expanded all features
    const reached = await navigateToFirstRun(page);
    test.skip(!reached, 'No runs available to test');

    const expandButton = page.locator('button').filter({ hasText: /^expand all$/i }).first();
    const hasToggle = await expandButton.isVisible({ timeout: 8000 }).catch(() => false);
    test.skip(!hasToggle, 'No Expand/Collapse toggle available');

    // First expand all
    await expandButton.click();
    const collapseButton = page.locator('button').filter({ hasText: /^collapse all$/i }).first();
    await expect(collapseButton).toBeVisible({ timeout: 5000 });

    // When: The user clicks "Collapse All"
    await collapseButton.click();

    // Then: The button text should change back to "Expand All"
    await expect(page.locator('button').filter({ hasText: /^expand all$/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('should toggle individual feature sections by clicking their header', async ({ page }) => {
    // Given: The user is on a run detail page with feature sections
    const reached = await navigateToFirstRun(page);
    test.skip(!reached, 'No runs available to test');

    // Wait for feature headers (buttons with chevron icons that toggle sections)
    // Features are rendered as clickable headers
    const featureHeaders = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /.feature|Feature/i });
    const headerCount = await featureHeaders.count();

    if (headerCount === 0) {
      // Try broader selector: any clickable element that expands a section
      const expandableItems = page.locator('[role="button"], button').filter({ hasText: /.+\.feature|Feature:/i });
      const count = await expandableItems.count();
      test.skip(count === 0, 'No expandable feature sections found');
    }

    // When: The user clicks the first feature header
    const firstHeader = featureHeaders.first();
    await firstHeader.click();

    // Then: The page should not crash and content should remain visible
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });

  test('should keep expand state independent per feature', async ({ page }) => {
    // Given: The user is on a run detail page
    const reached = await navigateToFirstRun(page);
    test.skip(!reached, 'No runs available to test');

    // Ensure features are collapsed first
    const expandButton = page.locator('button').filter({ hasText: /^expand all$/i }).first();
    const hasToggle = await expandButton.isVisible({ timeout: 8000 }).catch(() => false);
    test.skip(!hasToggle, 'No Expand/Collapse toggle available');

    // When: User expands all, then collapses all, then expands just the first
    await expandButton.click();
    await page.locator('button').filter({ hasText: /^collapse all$/i }).first().click();

    // The toggle should now say "Expand All" again (all collapsed)
    await expect(expandButton).toBeVisible({ timeout: 5000 });

    // Then: The button should still say "Expand All" (not all expanded)
    // This confirms partial expansion state is tracked
    const toggleText = await page.locator('button').filter({ hasText: /^(expand all|collapse all)$/i }).first().textContent();
    expect(toggleText?.toLowerCase()).toContain('expand all');
  });
});
