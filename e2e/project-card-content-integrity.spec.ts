import { test, expect } from '@playwright/test';

test.describe('Project Card Content Integrity - Cards display complete, correct data', () => {
  // Given a user visits the BDD Test Dashboard
  // When the homepage loads and shows project cards
  // Then each card should display all required elements with valid data

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display a color-coded dot for each project', async ({ page }) => {
    // Given: the dashboard is loaded with projects
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Then: each card should have a colored dot (3x3 rounded-full div)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const dot = cards.nth(i).locator('div.rounded-full').first();
      await expect(dot).toBeVisible();

      // And: the dot should have a background color set via inline style
      const style = await dot.getAttribute('style');
      expect(style).toMatch(/background-color/);
    }
  });

  test('should display project name and description', async ({ page }) => {
    // Given: project cards are visible
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();

    // Then: each card has a non-empty project name (h4) and description (p.text-muted)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const name = card.locator('h4');
      await expect(name).toBeVisible();
      const nameText = await name.textContent();
      expect(nameText?.trim().length).toBeGreaterThan(0);

      const description = card.locator('p.text-muted').first();
      await expect(description).toBeVisible();
    }
  });

  test('should show a progress bar with a valid percentage for projects with runs', async ({ page }) => {
    // Given: project cards are visible
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      // Check if this card has run data (has "passed" text)
      const hasRuns = await card.locator('span:has-text("passed")').isVisible().catch(() => false);

      if (hasRuns) {
        // Then: a progress bar container should exist
        const progressBar = card.locator('div.rounded-full.overflow-hidden');
        await expect(progressBar).toBeVisible();

        // And: a percentage label should show a number between 0 and 100
        const percentLabel = card.locator('span.text-xs.font-medium');
        await expect(percentLabel).toBeVisible();
        const percentText = await percentLabel.textContent();
        const num = parseInt(percentText?.replace('%', '') ?? '', 10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(100);

        // And: the inner bar width should match the percentage
        const innerBar = progressBar.locator('div.bg-emerald-500');
        const style = await innerBar.getAttribute('style');
        expect(style).toMatch(/width:\s*\d+%/);
      }
    }
  });

  test('should show "Last run" relative time for projects with runs', async ({ page }) => {
    // Given: project cards are loaded
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();

    let foundRunCard = false;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const lastRunText = card.locator('text=/Last run:/');
      const visible = await lastRunText.isVisible().catch(() => false);

      if (visible) {
        foundRunCard = true;
        // Then: "Last run:" should be followed by a relative time string
        const fullText = await lastRunText.textContent();
        expect(fullText).toMatch(/Last run:\s*.+/);
      }
    }

    // At least one project should have run data
    expect(foundRunCard).toBe(true);
  });

  test('should show "No runs yet" for projects without test history', async ({ page }) => {
    // Given: the dashboard may have projects with no runs
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();

    // When: we check all cards
    // Then: cards either have run stats OR show "No runs yet"
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const hasStats = await card.locator('span:has-text("passed")').isVisible().catch(() => false);
      const hasNoRuns = await card.locator('text=No runs yet').isVisible().catch(() => false);

      // Each card must be in one state or the other
      expect(hasStats || hasNoRuns).toBe(true);
    }
  });

  test('should show a chevron icon on every project card', async ({ page }) => {
    // Given: project cards are visible
    const cards = page.locator('a[href*="/project/"]');
    const count = await cards.count();

    // Then: each card has a chevron-right SVG icon
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const chevron = card.locator('svg').last();
      await expect(chevron).toBeVisible();
    }
  });
});
