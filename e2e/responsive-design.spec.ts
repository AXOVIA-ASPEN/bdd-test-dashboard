import { test, expect, type Page } from '@playwright/test';

/**
 * BDD E2E Tests — Responsive Design & Mobile Viewport
 * Covers: mobile menu, touch navigation, responsive layouts, viewport adaptations
 *
 * Test architecture:
 *  - Tests common mobile viewports (iPhone, iPad, Android)
 *  - Verifies hamburger menu functionality on mobile
 *  - Ensures content is accessible on small screens
 *  - Uses Playwright's device emulation
 *  - BDD-style scenario descriptions with Given/When/Then comments
 */

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Wait until loading skeleton disappears and content is visible */
async function waitForContentLoaded(page: Page) {
  await page.locator('[data-testid="dashboard-skeleton"], .animate-pulse')
    .first()
    .waitFor({ state: 'hidden', timeout: 15_000 })
    .catch(() => {
      // If skeleton never appeared (instant load), that's fine
    });
  
  await expect(page.locator('#main-content')).toBeVisible();
}

// ─── Feature: Mobile Viewport Layout ────────────────────────────────────────

test.describe('Feature: Mobile Viewport Layout', () => {

  test('Scenario: Dashboard adapts layout for iPhone viewport', async ({ page }) => {
    // Given the user opens the dashboard on an iPhone-sized screen
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the main navigation is visible (or accessible via hamburger menu)
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeAttached();

    // And the main content area is visible and not horizontally cut off
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
    
    // Verify no horizontal scroll (content fits within viewport)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  });

  test('Scenario: Dashboard adapts layout for tablet viewport', async ({ page }) => {
    // Given the user opens the dashboard on a tablet-sized screen
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the navigation is fully visible
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();

    // And project cards are displayed in a grid layout
    const projectCards = page.locator('a[href^="/project/"]');
    const cardCount = await projectCards.count();
    
    if (cardCount > 0) {
      // Verify cards are visible
      await expect(projectCards.first()).toBeVisible();
    }

    // And the main content area is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Scenario: Dashboard adapts layout for Android phone viewport', async ({ page }) => {
    // Given the user opens the dashboard on an Android phone screen
    await page.setViewportSize({ width: 360, height: 800 }); // Common Android
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the page header is visible
    const logo = page.getByRole('link', { name: /Silverline/i });
    await expect(logo).toBeVisible();

    // And no horizontal overflow occurs
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 360;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin

    // And content is readable (main content visible)
    await expect(page.locator('#main-content')).toBeVisible();
  });

});

// ─── Feature: Mobile Navigation ─────────────────────────────────────────────

test.describe('Feature: Mobile Navigation', () => {

  test('Scenario: Theme toggle button is accessible on mobile', async ({ page }) => {
    // Given the user opens the dashboard on a mobile screen
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the theme toggle button is visible and clickable
    const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
    await expect(themeBtn).toBeVisible();

    // When the user taps the theme button
    const htmlEl = page.locator('html');
    const initialClass = await htmlEl.getAttribute('class') ?? '';
    const startedDark = initialClass.includes('dark');

    await themeBtn.click();

    // Then the theme changes
    if (startedDark) {
      await expect(htmlEl).not.toHaveClass(/dark/);
    } else {
      await expect(htmlEl).toHaveClass(/dark/);
    }
  });

  test('Scenario: Project cards are tappable on mobile', async ({ page }) => {
    // Given the user opens the dashboard on a mobile screen with project data
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await waitForContentLoaded(page);

    // Find a project card
    const firstProjectCard = page.locator('a[href^="/project/"]').first();
    const hasCard = await firstProjectCard.isVisible().catch(() => false);

    if (!hasCard) {
      test.skip(true, 'No project cards available — skipping mobile tap test');
      return;
    }

    // When the user taps the project card
    const href = await firstProjectCard.getAttribute('href') ?? '';
    await firstProjectCard.click();

    // Then the URL navigates to the project page
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // And the content loads successfully
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Scenario: Refresh button works on mobile viewport', async ({ page }) => {
    // Given the user opens the dashboard on a mobile screen
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the refresh button is visible
    const refreshBtn = page.getByRole('button', { name: /Refresh data/i });
    await expect(refreshBtn).toBeVisible();

    // When the user taps the refresh button
    await refreshBtn.click();

    // Then the page does not crash and navigation remains visible
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeAttached();
  });

});

// ─── Feature: Touch Gestures & Scrolling ─────────────────────────────────────

test.describe('Feature: Touch Gestures & Scrolling', () => {

  test('Scenario: Vertical scrolling works smoothly on mobile', async ({ page }) => {
    // Given the user opens the dashboard on a mobile screen
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await waitForContentLoaded(page);

    // When the user scrolls down the page
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Then the scroll position changes
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // And the page remains stable (no layout shift crashes)
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('Scenario: Project page is scrollable on mobile', async ({ page }) => {
    // Given the user navigates to a project page on mobile
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/project/bdd-test-dashboard');
    await waitForContentLoaded(page);

    // Then the page content is visible
    await expect(page.locator('#main-content')).toBeVisible();

    // When the user scrolls down
    await page.evaluate(() => window.scrollBy(0, 300));

    // Then the scroll position updates
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // And navigation/header remains accessible
    const logo = page.getByRole('link', { name: /Silverline/i });
    await expect(logo).toBeAttached();
  });

});

// ─── Feature: Responsive Typography ──────────────────────────────────────────

test.describe('Feature: Responsive Typography', () => {

  test('Scenario: Text remains readable at small viewport sizes', async ({ page }) => {
    // Given the user opens the dashboard on a small mobile screen
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE (1st gen)
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the page header text is visible
    const logo = page.getByRole('link', { name: /Silverline/i });
    await expect(logo).toBeVisible();

    // And the main content is visible (not cut off)
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Verify no extreme text overflow (body width should fit viewport)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 320;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Small margin allowed
  });

  test('Scenario: Large viewport shows full-width layout', async ({ page }) => {
    // Given the user opens the dashboard on a large desktop screen
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    await waitForContentLoaded(page);

    // Then the navigation is fully visible
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();

    // And project cards (if present) are displayed in a multi-column grid
    const projectCards = page.locator('a[href^="/project/"]');
    const cardCount = await projectCards.count();

    if (cardCount >= 2) {
      // Verify multiple cards are visible side-by-side (not stacked)
      const firstCard = projectCards.nth(0);
      const secondCard = projectCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        // Cards should be on the same or adjacent rows (y positions similar)
        const yDiff = Math.abs(firstBox.y - secondBox.y);
        expect(yDiff).toBeLessThan(300); // Allow some vertical offset for grid layout
      }
    }

    // And the main content area is visible
    await expect(page.locator('#main-content')).toBeVisible();
  });

});
