import { test, expect } from '@playwright/test';

test.describe('Homepage - Dashboard loads and displays correctly', () => {
  // Given a user navigates to the BDD Test Dashboard
  // When the page finishes loading
  // Then they should see the dashboard title and project section

  test('should display the dashboard heading', async ({ page }) => {
    await page.goto('/');
    // The app title is "Acceptance Test Dashboard"
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should display the Projects section heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
  });

  test('should render project links with names', async ({ page }) => {
    await page.goto('/');
    // Wait for the Projects heading first
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
    // Project cards are <a> tags with h4 names inside
    const projectNames = page.locator('h4.font-semibold');
    await expect(projectNames.first()).toBeVisible({ timeout: 10000 });
    expect(await projectNames.count()).toBeGreaterThan(0);
  });

  test('should not show error state on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
    // No error messages visible
    const errorText = page.locator('text=Something went wrong');
    await expect(errorText).toHaveCount(0);
  });
});
