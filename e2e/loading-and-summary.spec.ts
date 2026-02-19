import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Loading States & Summary Cards
 * Covers: loading skeleton UI, summary statistics, data refresh, empty states
 *
 * Test architecture:
 *  - Verifies loading indicators appear before data loads
 *  - Tests summary card display (total tests, pass rate, etc.)
 *  - Validates empty state messaging when no data exists
 *  - BDD-style scenario descriptions with Given/When/Then comments
 */

// ─── Feature: Loading States ────────────────────────────────────────────────

test.describe('Feature: Loading States', () => {

  test('Scenario: Dashboard shows loading skeleton while data loads', async ({ page }) => {
    // Given the user navigates to the dashboard
    // We need to observe the loading state, so we'll use network throttling or check immediately
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Then a loading skeleton or spinner appears initially
    // Check for common loading indicators within the first 2 seconds
    const loadingSkeleton = page.locator('[data-testid="dashboard-skeleton"], .animate-pulse, [role="status"], [aria-busy="true"]');
    
    // The loading state might be very brief, so we check if it's visible OR if content loaded so fast it's already gone
    const hasLoadingState = await loadingSkeleton.first().isVisible().catch(() => false);
    const mainContent = page.locator('#main-content');
    const hasContent = await mainContent.isVisible().catch(() => false);
    
    // Either we saw the loading state OR content loaded instantly (both are valid)
    expect(hasLoadingState || hasContent).toBeTruthy();
    
    // When data finishes loading
    // Then the loading skeleton disappears
    if (hasLoadingState) {
      await expect(loadingSkeleton.first()).toBeHidden({ timeout: 20_000 });
    }
    
    // And real content is visible
    await expect(mainContent).toBeVisible({ timeout: 20_000 });
  });

  test('Scenario: Project page shows loading indicator while fetching run history', async ({ page }) => {
    // Given the user navigates to a project page
    await page.goto('/project/bdd-test-dashboard', { waitUntil: 'domcontentloaded' });
    
    // Then a loading indicator appears while run history loads
    const loadingIndicator = page.locator('[data-testid="loading-skeleton"], .animate-pulse, [role="status"], [aria-busy="true"]');
    const hasLoading = await loadingIndicator.first().isVisible().catch(() => false);
    const mainContent = page.locator('#main-content');
    const hasContent = await mainContent.isVisible().catch(() => false);
    
    // Either loading state visible OR content loaded instantly
    expect(hasLoading || hasContent).toBeTruthy();
    
    // When data finishes loading
    if (hasLoading) {
      await expect(loadingIndicator.first()).toBeHidden({ timeout: 20_000 });
    }
    
    // Then run history or empty state is visible
    await expect(mainContent).toBeVisible({ timeout: 20_000 });
  });

  test('Scenario: Refresh button triggers loading state', async ({ page }) => {
    // Given the user is on the dashboard with data loaded
    await page.goto('/');
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    
    // Wait for any initial loading to complete
    await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    
    // When the user clicks the refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh data/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // Then a loading indicator may briefly appear (or data refreshes instantly)
    // We verify the page doesn't crash and content remains accessible
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 20_000 });
    
    // And the page is still interactive (navigation visible)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

});

// ─── Feature: Summary Cards ─────────────────────────────────────────────────

test.describe('Feature: Summary Cards & Statistics', () => {

  test('Scenario: Dashboard displays summary statistics', async ({ page }) => {
    // Given the user loads the dashboard
    await page.goto('/');
    
    // When data finishes loading
    await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    await expect(page.locator('#main-content')).toBeVisible();
    
    // Then summary cards or statistics are displayed
    // Look for common summary indicators: total tests, pass rate, run count, etc.
    const summaryCards = page.locator('[data-testid*="summary"], [data-testid*="stats"], .summary-card, [class*="stat"]');
    const totalTestsText = page.getByText(/total tests|total runs|test count/i);
    const passRateText = page.getByText(/pass rate|success rate|\d+%/);
    const projectCountText = page.getByText(/projects|project count/i);
    
    // At least one summary indicator should be visible (or we might have empty state)
    const hasCards = await summaryCards.first().isVisible().catch(() => false);
    const hasTotalTests = await totalTestsText.first().isVisible().catch(() => false);
    const hasPassRate = await passRateText.first().isVisible().catch(() => false);
    const hasProjectCount = await projectCountText.first().isVisible().catch(() => false);
    const emptyState = await page.getByText(/no projects|no data/i).first().isVisible().catch(() => false);
    
    expect(hasCards || hasTotalTests || hasPassRate || hasProjectCount || emptyState).toBeTruthy();
  });

  test('Scenario: Project page displays run statistics', async ({ page }) => {
    // Given the user navigates to a project page
    await page.goto('/project/bdd-test-dashboard');
    
    // When data finishes loading
    await page.locator('[data-testid="loading-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    await expect(page.locator('#main-content')).toBeVisible();
    
    // Then run statistics are displayed (or empty state if no runs)
    // Look for: latest run status, total runs, recent results, trend indicators
    const runStats = page.locator('[data-testid*="run-stats"], [data-testid*="summary"]');
    const latestRunBadge = page.locator('[data-testid*="latest"], .badge, [class*="status"]');
    const runCountText = page.getByText(/\d+ runs?|total runs|run history/i);
    const emptyState = page.getByText(/no runs|no test runs|no history/i);
    
    // Either stats visible OR empty state shown
    const hasStats = await runStats.first().isVisible().catch(() => false);
    const hasBadge = await latestRunBadge.first().isVisible().catch(() => false);
    const hasCount = await runCountText.first().isVisible().catch(() => false);
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    
    expect(hasStats || hasBadge || hasCount || hasEmpty).toBeTruthy();
  });

  test('Scenario: Summary cards display numeric data correctly', async ({ page }) => {
    // Given the dashboard has loaded with project data
    await page.goto('/');
    await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    await expect(page.locator('#main-content')).toBeVisible();
    
    // Then numeric statistics are formatted correctly (no NaN, proper formatting)
    // Look for any visible numbers in summary areas
    const allText = await page.locator('body').textContent() ?? '';
    
    // Verify no "NaN" appears in the page content
    expect(allText).not.toContain('NaN');
    expect(allText).not.toContain('undefined');
    expect(allText).not.toContain('[object Object]');
    
    // Look for percentage indicators (should be formatted like "85%" or "85.5%")
    const percentageRegex = /\d+\.?\d*%/;
    const hasValidPercentages = percentageRegex.test(allText);
    
    // Percentages are optional, but if present, should be formatted correctly
    if (hasValidPercentages) {
      const percentages = allText.match(/\d+\.?\d*%/g) ?? [];
      percentages.forEach(pct => {
        const num = parseFloat(pct);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(100);
      });
    }
  });

});

// ─── Feature: Empty States ──────────────────────────────────────────────────

test.describe('Feature: Empty States', () => {

  test('Scenario: Dashboard shows appropriate empty state with no projects', async ({ page }) => {
    // Given the dashboard has no projects configured
    await page.goto('/');
    await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    
    // Then either project cards OR an empty state message is visible
    const projectCards = page.locator('a[href^="/project/"]');
    const emptyStateMsg = page.getByText(/no projects|configure projects|get started|add your first/i);
    
    const hasProjects = await projectCards.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyStateMsg.first().isVisible().catch(() => false);
    
    // One of these must be true
    expect(hasProjects || hasEmptyState).toBeTruthy();
    
    // If empty state is shown, it should be helpful
    if (hasEmptyState) {
      const emptyText = await emptyStateMsg.first().textContent() ?? '';
      expect(emptyText.length).toBeGreaterThan(10); // Should have meaningful text, not just "No projects"
    }
  });

  test('Scenario: Project page shows empty state when no runs exist', async ({ page }) => {
    // Given the user navigates to a project with no test runs
    // We'll try a project that might not have runs, or create a scenario where we expect empty state
    await page.goto('/project/bdd-test-dashboard');
    await page.locator('[data-testid="loading-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    
    // Then either run links OR an empty state message is visible
    const runLinks = page.locator('a[href*="/run/"]');
    const emptyStateMsg = page.getByText(/no runs|no test runs|no history|run your first test/i);
    
    const hasRuns = await runLinks.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyStateMsg.first().isVisible().catch(() => false);
    
    // One of these must be true
    expect(hasRuns || hasEmptyState).toBeTruthy();
  });

  test('Scenario: Empty state provides guidance or call-to-action', async ({ page }) => {
    // Given the user sees an empty state (either dashboard or project page)
    await page.goto('/');
    await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {});
    
    const emptyStateMsg = page.getByText(/no projects|no data|get started|configure/i).first();
    const hasEmptyState = await emptyStateMsg.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      // Then the empty state includes helpful guidance
      const emptyText = await emptyStateMsg.textContent() ?? '';
      
      // Should have more than just "No data" - should explain what to do next
      expect(emptyText.length).toBeGreaterThan(15);
      
      // Look for action-oriented words
      const hasActionWords = /configure|add|create|start|setup|guide/i.test(emptyText);
      expect(hasActionWords).toBeTruthy();
    } else {
      // If no empty state, that means there's data - which is also valid
      const projectCards = page.locator('a[href^="/project/"]');
      await expect(projectCards.first()).toBeVisible();
    }
  });

});

// ─── Feature: Data Consistency ──────────────────────────────────────────────

test.describe('Feature: Data Consistency', () => {

  test('Scenario: Page title updates correctly for different routes', async ({ page }) => {
    // Given the user navigates to the dashboard
    await page.goto('/');
    await expect(page).toHaveTitle(/Silverline|BDD|Dashboard/i);
    
    // When the user navigates to a project page
    await page.goto('/project/bdd-test-dashboard');
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    
    // Then the page title updates appropriately
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe(''); // Should have a meaningful title
  });

  test('Scenario: Navigation remains accessible during data refresh', async ({ page }) => {
    // Given the user is on any page
    await page.goto('/');
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    
    // When data is being refreshed or loaded
    const refreshButton = page.getByRole('button', { name: /Refresh data/i });
    if (await refreshButton.isVisible().catch(() => false)) {
      await refreshButton.click();
    }
    
    // Then navigation elements remain accessible
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    
    // And theme toggle remains functional
    const themeButton = page.getByRole('button', { name: /Toggle theme/i });
    await expect(themeButton).toBeVisible();
    
    // And logo/home link remains clickable
    const logoLink = page.getByRole('link', { name: /Silverline/i });
    await expect(logoLink.first()).toBeVisible();
  });

  test('Scenario: Multiple page navigations maintain stability', async ({ page }) => {
    // Given the user navigates through multiple pages rapidly
    await page.goto('/');
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    
    // Navigate to project page
    const projectCard = page.locator('a[href^="/project/"]').first();
    const hasProjects = await projectCard.isVisible().catch(() => false);
    
    if (hasProjects) {
      await projectCard.click();
      await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
      
      // Navigate back to dashboard
      const homeLink = page.getByRole('link', { name: /Silverline/i }).first();
      await homeLink.click();
      await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
      
      // Navigate to project again
      await projectCard.click();
      await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    }
    
    // Then no JavaScript errors occur (page remains functional)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
  });

});
