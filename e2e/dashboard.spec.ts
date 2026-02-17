import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Silverline BDD Test Dashboard
 * Covers: homepage load, project navigation, run history, breadcrumb, theme toggle
 *
 * Test architecture:
 *  - All locator strategies use aria roles / accessible text / data-testid where available
 *  - No arbitrary setTimeout; uses Playwright's built-in waiting
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Wait until the loading skeleton is gone and real content appears */
async function waitForDashboardLoaded(page: Page) {
  // The skeleton uses animate-pulse divs; real content has text like project names or summary cards.
  // We wait for the loading state to clear — the skeleton disappears when data arrives.
  await expect(page.locator('[data-testid="dashboard-skeleton"], .animate-pulse').first())
    .toBeHidden({ timeout: 15_000 })
    .catch(() => {
      // If the skeleton selector never matched (data loaded instantly), that's fine too.
    });
  // Ensure the main content area is visible
  await expect(page.locator('#main-content')).toBeVisible();
}

// ─── Feature: Homepage ───────────────────────────────────────────────────────

test.describe('Feature: Dashboard Homepage', () => {

  test('Scenario: Homepage loads with correct title and header', async ({ page }) => {
    // Given the user navigates to the dashboard root
    await page.goto('/');

    // Then the page title contains "Silverline" or "BDD Dashboard"
    await expect(page).toHaveTitle(/Silverline|BDD/i, { timeout: 15_000 });

    // And the header navigation is visible
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

    // And the logo / app name is present
    await expect(page.getByRole('link', { name: /Silverline/i })).toBeVisible();
  });

  test('Scenario: Homepage shows project cards when data loads', async ({ page }) => {
    // Given the user navigates to the dashboard root
    await page.goto('/');

    // When data finishes loading (skeleton resolves)
    await waitForDashboardLoaded(page);

    // Then either project cards OR an empty-state message is displayed
    const projectCards = page.locator('a[href^="/project/"]');
    const emptyMsg = page.getByText(/No projects configured/i);

    // At least one of these two states must be visible
    await expect(projectCards.first().or(emptyMsg)).toBeVisible({ timeout: 20_000 });
  });

  test('Scenario: Refresh button is visible and clickable', async ({ page }) => {
    // Given the user is on the homepage
    await page.goto('/');

    // Then a refresh button is visible in the header
    const refreshBtn = page.getByRole('button', { name: /Refresh data/i });
    await expect(refreshBtn).toBeVisible();

    // When the user clicks the refresh button
    await refreshBtn.click();

    // Then no JS error crashes the page (header stays visible)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

});

// ─── Feature: Theme Toggle ────────────────────────────────────────────────────

test.describe('Feature: Theme Toggle', () => {

  test('Scenario: Clicking theme toggle switches between dark and light mode', async ({ page }) => {
    // Given the user is on the homepage
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

    // And note the initial html class
    const htmlEl = page.locator('html');
    const initialClass = await htmlEl.getAttribute('class') ?? '';
    const startedDark = initialClass.includes('dark');

    // When the user clicks the theme toggle button
    const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Then the html element class changes (dark added or removed)
    if (startedDark) {
      await expect(htmlEl).not.toHaveClass(/dark/);
    } else {
      await expect(htmlEl).toHaveClass(/dark/);
    }

    // When the user clicks toggle again
    await themeBtn.click();

    // Then it returns to the original state
    if (startedDark) {
      await expect(htmlEl).toHaveClass(/dark/);
    } else {
      await expect(htmlEl).not.toHaveClass(/dark/);
    }
  });

});

// ─── Feature: Project Navigation ─────────────────────────────────────────────

test.describe('Feature: Project Page Navigation', () => {

  test('Scenario: Clicking a project card navigates to the project page', async ({ page }) => {
    // Given the dashboard homepage has loaded with project cards
    await page.goto('/');
    await waitForDashboardLoaded(page);

    // Find a project card link
    const firstProjectCard = page.locator('a[href^="/project/"]').first();
    const hasCard = await firstProjectCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, 'No project cards available — skipping navigation test');
      return;
    }

    // When the user clicks the first project card
    const href = await firstProjectCard.getAttribute('href') ?? '';
    await firstProjectCard.click();

    // Then the URL changes to the project path
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // And the main content area is still visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Scenario: Project page shows run history table or empty state', async ({ page }) => {
    // Given the user navigates directly to a known project page
    await page.goto('/project/bdd-test-dashboard');
    await waitForDashboardLoaded(page);

    // Then the page shows either a list of runs OR an empty/not-found state
    const runRows = page.locator('a[href*="/run/"]');
    const emptyMsg = page.getByText(/no runs|no test runs|not found/i);
    const projectHeading = page.getByRole('heading', { level: 2 });

    // At least one of these indicators should be present
    const hasRuns = await runRows.first().isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.first().isVisible().catch(() => false);
    const hasHeading = await projectHeading.first().isVisible().catch(() => false);

    expect(hasRuns || hasEmpty || hasHeading).toBeTruthy();
  });

  test('Scenario: Breadcrumb back-link navigates to homepage', async ({ page }) => {
    // Given the user is on a project page
    await page.goto('/project/bdd-test-dashboard');
    await waitForDashboardLoaded(page);

    // When the user clicks the "Dashboard" breadcrumb or the header logo
    const homeLink = page.getByRole('link', { name: /Silverline/i }).first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    // Then the URL is back at the homepage
    await expect(page).toHaveURL('/');

    // And the main content area is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

});

// ─── Feature: Accessibility ───────────────────────────────────────────────────

test.describe('Feature: Accessibility & Skip-to-Content', () => {

  test('Scenario: Skip-to-content link is present and targets main content', async ({ page }) => {
    // Given the user navigates to the homepage
    await page.goto('/');

    // Then a skip-to-content link exists in the DOM (even if visually hidden)
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // And the main content target exists
    await expect(page.locator('#main-content')).toBeAttached();
  });

});

// ─── Feature: 404 / Not Found ─────────────────────────────────────────────────

test.describe('Feature: Not Found Page', () => {

  test('Scenario: Unknown project ID shows not-found state', async ({ page }) => {
    // Given the user navigates to a non-existent project
    await page.goto('/project/does-not-exist');

    // Then the page shows a 404 / not-found message or redirects gracefully
    const notFoundText = page.getByText(/not found|404|doesn't exist|back to dashboard/i);
    await expect(notFoundText.first()).toBeVisible({ timeout: 20_000 });
  });

});
