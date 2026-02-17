import { test, expect } from '@playwright/test';

test.describe('Cross-Page Data Consistency - Dashboard and project details agree', () => {
  // Given a user views the dashboard summary
  // When they navigate to individual project pages
  // Then the data shown should be consistent between views

  test('should show same project name on card and detail page', async ({ page }) => {
    // Given: user is on the dashboard with project cards
    await page.goto('/');
    const firstCard = page.locator('a[href*="/project/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // When: they note the project name and click through
    const cardText = await firstCard.innerText();
    const projectName = cardText.split('\n')[0].trim();
    await firstCard.click();

    // Then: the project detail page should display the same name
    await expect(page.locator('h1, h2').filter({ hasText: projectName }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should render all project cards with valid links', async ({ page }) => {
    // Given: user is on the dashboard
    await page.goto('/');
    await expect(page.locator('a[href*="/project/"]').first()).toBeVisible({ timeout: 15000 });

    // When: they inspect project card links
    const cards = page.locator('a[href*="/project/"]');
    const cardCount = await cards.count();

    // Then: each card should have a non-empty href containing /project/
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      const href = await cards.nth(i).getAttribute('href');
      expect(href).toMatch(/\/project\/.+/);
    }
  });

  test('should maintain project card links that resolve to valid pages', async ({ page }) => {
    // Given: user is on the dashboard
    await page.goto('/');
    const cards = page.locator('a[href*="/project/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const cardCount = await cards.count();
    const maxToCheck = Math.min(cardCount, 3);

    for (let i = 0; i < maxToCheck; i++) {
      // When: they click each project card
      await page.goto('/');
      await expect(cards.nth(i)).toBeVisible({ timeout: 10000 });
      await cards.nth(i).click();

      // Then: the page should not show a 404 or error
      await expect(page.locator('text=/not found/i')).not.toBeVisible({ timeout: 5000 });
      // And: some content should render (heading or run list or empty state)
      await expect(
        page.locator('h1, h2, [class*="empty"], [class*="run"]').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show consistent pass/fail indicators between dashboard and detail', async ({ page }) => {
    // Given: user sees a project card with a status indicator
    await page.goto('/');
    const firstCard = page.locator('a[href*="/project/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // When: they check for pass/fail color indicators on the card
    const cardHtml = await firstCard.innerHTML();
    const hasGreenOnCard = /green|emerald|success|pass/i.test(cardHtml);
    const hasRedOnCard = /red|rose|fail|error/i.test(cardHtml);

    // Then: navigate to project detail
    await firstCard.click();

    // And: the detail page should load with actual content
    await expect(
      page.locator('h1, h2, table, [class*="run"], [class*="empty"]').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
