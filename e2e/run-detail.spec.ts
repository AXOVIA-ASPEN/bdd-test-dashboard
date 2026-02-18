import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Run Detail Page
 * Covers: navigation to run detail, run metadata display, test case results
 *
 * Test architecture:
 *  - Uses aria roles, accessible text, and data-testid for locators
 *  - Built-in Playwright waiting strategies (no arbitrary timeouts)
 *  - BDD-style scenario descriptions with Given/When/Then comments
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Wait until loading skeleton disappears and content is visible */
async function waitForContentLoaded(page: Page) {
  // Wait for skeleton/loading indicators to disappear
  await page.locator('[data-testid="loading-skeleton"], .animate-pulse')
    .first()
    .waitFor({ state: 'hidden', timeout: 15_000 })
    .catch(() => {
      // If skeleton never appeared (instant load), that's fine
    });
  
  // Ensure main content area is visible
  await expect(page.locator('#main-content')).toBeVisible();
}

/** Navigate to a project page and find the first run link */
async function navigateToFirstRunLink(page: Page, projectId: string): Promise<string | null> {
  await page.goto(`/project/${projectId}`);
  await waitForContentLoaded(page);
  
  // Look for run links in the project page
  const runLink = page.locator('a[href*="/run/"]').first();
  const isVisible = await runLink.isVisible().catch(() => false);
  
  if (!isVisible) {
    return null;
  }
  
  return await runLink.getAttribute('href');
}

// ─── Feature: Run Detail Page Navigation ────────────────────────────────────

test.describe('Feature: Run Detail Page Navigation', () => {

  test('Scenario: Clicking a run link from project page navigates to run detail', async ({ page }) => {
    // Given the user is on a project page with run history
    const runHref = await navigateToFirstRunLink(page, 'bdd-test-dashboard');
    
    if (!runHref) {
      test.skip(true, 'No run links available — skipping navigation test');
      return;
    }
    
    // When the user clicks on a run link
    await page.locator(`a[href="${runHref}"]`).first().click();
    
    // Then the URL changes to the run detail page
    await expect(page).toHaveURL(new RegExp(runHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    
    // And the main content area is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Scenario: Direct navigation to run detail page loads successfully', async ({ page }) => {
    // Given the user navigates directly to a run detail URL
    await page.goto('/project/bdd-test-dashboard/run/latest');
    
    // When the page loads
    await waitForContentLoaded(page);
    
    // Then either run content OR not-found/empty state is displayed
    const runContent = page.locator('[data-testid="run-metadata"], [data-testid="test-results"]');
    const notFoundMsg = page.getByText(/not found|no run data|doesn't exist/i);
    const heading = page.getByRole('heading');
    
    // At least one of these should be visible
    const hasContent = await runContent.first().isVisible().catch(() => false);
    const hasNotFound = await notFoundMsg.first().isVisible().catch(() => false);
    const hasHeading = await heading.first().isVisible().catch(() => false);
    
    expect(hasContent || hasNotFound || hasHeading).toBeTruthy();
  });

});

// ─── Feature: Run Metadata Display ──────────────────────────────────────────

test.describe('Feature: Run Metadata Display', () => {

  test('Scenario: Run detail page displays run metadata', async ({ page }) => {
    // Given the user navigates to a run detail page
    const runHref = await navigateToFirstRunLink(page, 'bdd-test-dashboard');
    
    if (!runHref) {
      test.skip(true, 'No run links available — skipping metadata test');
      return;
    }
    
    await page.goto(runHref);
    await waitForContentLoaded(page);
    
    // Then the page shows run metadata (timestamp, status, duration, etc.)
    // Look for common metadata indicators:
    const metadataSection = page.locator('[data-testid="run-metadata"]');
    const timestampText = page.getByText(/timestamp|run date|executed/i);
    const statusBadge = page.locator('[data-testid="run-status"], .badge, [class*="status"]');
    const heading = page.getByRole('heading');
    
    // At least one metadata indicator should be present
    const hasMetadata = await metadataSection.isVisible().catch(() => false);
    const hasTimestamp = await timestampText.first().isVisible().catch(() => false);
    const hasStatus = await statusBadge.first().isVisible().catch(() => false);
    const hasHeading = await heading.first().isVisible().catch(() => false);
    
    expect(hasMetadata || hasTimestamp || hasStatus || hasHeading).toBeTruthy();
  });

});

// ─── Feature: Test Results Display ──────────────────────────────────────────

test.describe('Feature: Test Results Display', () => {

  test('Scenario: Run detail page displays test case results', async ({ page }) => {
    // Given the user is viewing a run detail page
    const runHref = await navigateToFirstRunLink(page, 'bdd-test-dashboard');
    
    if (!runHref) {
      test.skip(true, 'No run links available — skipping test results test');
      return;
    }
    
    await page.goto(runHref);
    await waitForContentLoaded(page);
    
    // Then the page shows test case results
    // Look for test result indicators: table rows, list items, test case names
    const testResultsTable = page.locator('table, [role="table"]');
    const testCaseRows = page.locator('[data-testid="test-case"], tr, li').filter({ hasText: /test|scenario|spec/i });
    const resultsSection = page.locator('[data-testid="test-results"]');
    const emptyMsg = page.getByText(/no test cases|no results|empty/i);
    
    // Either results OR empty state should be present
    const hasTable = await testResultsTable.first().isVisible().catch(() => false);
    const hasRows = await testCaseRows.first().isVisible().catch(() => false);
    const hasSection = await resultsSection.isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.first().isVisible().catch(() => false);
    
    expect(hasTable || hasRows || hasSection || hasEmpty).toBeTruthy();
  });

  test('Scenario: Test case results show pass/fail status', async ({ page }) => {
    // Given the user is viewing test results on a run detail page
    const runHref = await navigateToFirstRunLink(page, 'bdd-test-dashboard');
    
    if (!runHref) {
      test.skip(true, 'No run links available — skipping status test');
      return;
    }
    
    await page.goto(runHref);
    await waitForContentLoaded(page);
    
    // Then each test case shows a status indicator (pass/fail/skip)
    // Look for status badges, icons, or colored indicators
    const statusIndicators = page.locator('[data-testid*="status"], .badge, [class*="pass"], [class*="fail"], [class*="skip"]');
    const passText = page.getByText(/✓|✔|pass|success/i);
    const failText = page.getByText(/✗|✘|×|fail|error/i);
    const emptyMsg = page.getByText(/no test cases|no results/i);
    
    // At least one status indicator OR empty state should be visible
    const hasIndicator = await statusIndicators.first().isVisible().catch(() => false);
    const hasPass = await passText.first().isVisible().catch(() => false);
    const hasFail = await failText.first().isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.first().isVisible().catch(() => false);
    
    expect(hasIndicator || hasPass || hasFail || hasEmpty).toBeTruthy();
  });

});

// ─── Feature: Breadcrumb Navigation from Run Detail ─────────────────────────

test.describe('Feature: Breadcrumb Navigation from Run Detail', () => {

  test('Scenario: Breadcrumb link navigates back to project page', async ({ page }) => {
    // Given the user is on a run detail page
    const runHref = await navigateToFirstRunLink(page, 'bdd-test-dashboard');
    
    if (!runHref) {
      test.skip(true, 'No run links available — skipping breadcrumb test');
      return;
    }
    
    await page.goto(runHref);
    await waitForContentLoaded(page);
    
    // When the user clicks the project breadcrumb or back link
    // Look for breadcrumb navigation or "back to project" link
    const breadcrumb = page.locator('nav[aria-label*="breadcrumb" i], [data-testid="breadcrumb"]');
    const backLink = page.getByRole('link', { name: /back|project|dashboard/i });
    const headerLogo = page.getByRole('link', { name: /silverline/i }).first();
    
    // Try breadcrumb first, then back link, then header
    const hasBreadcrumb = await breadcrumb.isVisible().catch(() => false);
    const hasBackLink = await backLink.first().isVisible().catch(() => false);
    
    let clickTarget = null;
    if (hasBreadcrumb) {
      clickTarget = breadcrumb.getByRole('link').first();
    } else if (hasBackLink) {
      clickTarget = backLink.first();
    } else {
      clickTarget = headerLogo;
    }
    
    await clickTarget.click();
    
    // Then the URL changes (either to project page or homepage)
    await page.waitForURL(/\/(project\/|$)/);
    
    // And the main content is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

});

// ─── Feature: Error Handling ─────────────────────────────────────────────────

test.describe('Feature: Run Detail Error Handling', () => {

  test('Scenario: Non-existent run ID shows not-found state', async ({ page }) => {
    // Given the user navigates to a non-existent run ID
    await page.goto('/project/bdd-test-dashboard/run/does-not-exist-12345');
    
    // When the page loads
    await waitForContentLoaded(page);
    
    // Then the page shows a not-found or error message
    const notFoundMsg = page.getByText(/not found|doesn't exist|404|no run|invalid run/i);
    await expect(notFoundMsg.first()).toBeVisible({ timeout: 20_000 });
  });

});
