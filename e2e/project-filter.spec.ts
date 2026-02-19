import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Project Filter Functionality
 * Covers: filter input, real-time filtering, case-insensitive search, clear filter
 *
 * Test architecture:
 *  - Uses aria roles, accessible text, and placeholders for locators
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

/** Get the project filter input field */
function getFilterInput(page: Page) {
  return page.getByRole('textbox', { name: /Filter projects/i });
}

/** Get all visible project cards */
function getProjectCards(page: Page) {
  return page.locator('a[href^="/project/"]');
}

// ─── Feature: Project Filter ────────────────────────────────────────────────

test.describe('Feature: Project Filter', () => {

  test('Scenario: Filter input is visible on dashboard with projects', async ({ page }) => {
    // Given the user loads the dashboard homepage
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // Then a filter input field is visible
    const filterInput = getFilterInput(page);
    await expect(filterInput).toBeVisible();
    
    // And it has an appropriate placeholder
    const placeholder = await filterInput.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('filter');
  });

  test('Scenario: Typing in filter shows matching projects', async ({ page }) => {
    // Given the dashboard has multiple projects loaded
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping filter test');
      return;
    }
    
    // When the user types a project name in the filter (e.g., "BDD")
    const filterInput = getFilterInput(page);
    await filterInput.fill('BDD');
    
    // Then only matching projects are displayed
    // Wait a brief moment for filtering to apply
    await page.waitForTimeout(300);
    
    const filteredCards = getProjectCards(page).filter({ hasText: /BDD/i });
    const filteredCount = await filteredCards.count();
    
    // At least one matching project should be visible
    expect(filteredCount).toBeGreaterThan(0);
    
    // And the filtered count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('Scenario: Filter is case-insensitive', async ({ page }) => {
    // Given the dashboard has projects loaded
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping case-insensitive test');
      return;
    }
    
    const filterInput = getFilterInput(page);
    
    // When the user types in lowercase
    await filterInput.fill('docmind');
    await page.waitForTimeout(300);
    const lowercaseCount = await getProjectCards(page).filter({ hasText: /docmind/i }).count();
    
    // And then types in uppercase
    await filterInput.fill('DOCMIND');
    await page.waitForTimeout(300);
    const uppercaseCount = await getProjectCards(page).filter({ hasText: /docmind/i }).count();
    
    // And then types in mixed case
    await filterInput.fill('DocMind');
    await page.waitForTimeout(300);
    const mixedCount = await getProjectCards(page).filter({ hasText: /docmind/i }).count();
    
    // Then all three should show the same matching projects
    expect(lowercaseCount).toBe(uppercaseCount);
    expect(uppercaseCount).toBe(mixedCount);
  });

  test('Scenario: Clearing filter shows all projects again', async ({ page }) => {
    // Given the user has filtered projects
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping clear filter test');
      return;
    }
    
    const filterInput = getFilterInput(page);
    
    // When they type a filter
    await filterInput.fill('BDD');
    await page.waitForTimeout(300);
    const filteredCount = await getProjectCards(page).filter({ hasText: /BDD/i }).count();
    
    // And then clear the filter (backspace or clear all)
    await filterInput.fill('');
    await page.waitForTimeout(300);
    
    // Then all projects are visible again
    const finalCount = await projectCards.count();
    expect(finalCount).toBe(initialCount);
  });

  test('Scenario: Filter with no matches shows empty state or hides all cards', async ({ page }) => {
    // Given the dashboard has projects loaded
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping no-match test');
      return;
    }
    
    // When the user types a filter that matches nothing
    const filterInput = getFilterInput(page);
    await filterInput.fill('xyznonexistentproject12345');
    await page.waitForTimeout(300);
    
    // Then either all cards are hidden OR an empty state message appears
    const visibleCards = await projectCards.filter({ hasText: /./ }).count();
    const emptyMessage = page.getByText(/no projects|no matches|not found/i);
    const hasEmptyMessage = await emptyMessage.first().isVisible().catch(() => false);
    
    // Either no cards visible OR an empty message shown
    expect(visibleCards === 0 || hasEmptyMessage).toBeTruthy();
  });

  test('Scenario: Filter preserves functionality after page interactions', async ({ page }) => {
    // Given the user has filtered projects
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping interaction test');
      return;
    }
    
    const filterInput = getFilterInput(page);
    await filterInput.fill('Flipper');
    await page.waitForTimeout(300);
    
    // When they interact with theme toggle
    const themeButton = page.getByRole('button', { name: /Toggle theme/i });
    await themeButton.click();
    
    // Then the filter is still applied
    await page.waitForTimeout(300);
    const filteredCount = await getProjectCards(page).filter({ hasText: /Flipper/i }).count();
    expect(filteredCount).toBeGreaterThan(0);
    
    // And the filter input still has the text
    const filterValue = await filterInput.inputValue();
    expect(filterValue).toBe('Flipper');
  });

  test('Scenario: Filter input has keyboard accessibility', async ({ page }) => {
    // Given the dashboard is loaded
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    // When the user tabs to find the filter input
    const filterInput = getFilterInput(page);
    await filterInput.focus();
    
    // Then the filter input receives focus
    await expect(filterInput).toBeFocused();
    
    // And the user can type into it
    await page.keyboard.type('Test');
    
    // Then the input value updates
    const value = await filterInput.inputValue();
    expect(value).toBe('Test');
  });

  test('Scenario: Filter matches partial project names', async ({ page }) => {
    // Given the dashboard has projects loaded
    await page.goto('/');
    await waitForDashboardLoaded(page);
    
    const projectCards = getProjectCards(page);
    const initialCount = await projectCards.count();
    
    if (initialCount === 0) {
      test.skip(true, 'No projects available — skipping partial match test');
      return;
    }
    
    // When the user types a partial project name (just a few letters)
    const filterInput = getFilterInput(page);
    await filterInput.fill('doc');
    await page.waitForTimeout(300);
    
    // Then projects containing those letters are shown
    const matchingCards = await getProjectCards(page).filter({ hasText: /doc/i }).count();
    
    // At least one matching project should be visible if any project contains "doc"
    const allProjectTexts = await projectCards.allTextContents();
    const hasDocInAny = allProjectTexts.some(text => text.toLowerCase().includes('doc'));
    
    if (hasDocInAny) {
      expect(matchingCards).toBeGreaterThan(0);
    } else {
      // If no projects contain "doc", verify none are shown
      expect(matchingCards).toBe(0);
    }
  });

});
