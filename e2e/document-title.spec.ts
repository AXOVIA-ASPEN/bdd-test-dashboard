import { test, expect } from '@playwright/test';

test.describe('Document Title - Dynamic page titles', () => {
  // Given: The BDD Dashboard app updates document.title based on the current page
  // When: A user navigates between pages
  // Then: The browser tab title should reflect the current context

  test('should show default title on homepage', async ({ page }) => {
    // Given: The user navigates to the dashboard homepage
    await page.goto('/');
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // Then: The document title should be the default dashboard title
    await expect(page).toHaveTitle(/Silverline.*Acceptance Test Dashboard/i);
  });

  test('should update title to include project name on project page', async ({ page }) => {
    // Given: The user is on the homepage
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });

    // Capture the project name
    const projectName = await projectLink.locator('h4').first().textContent();

    // When: The user clicks on a project card
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Then: The document title should include the project name and "BDD Dashboard"
    if (projectName?.trim()) {
      await expect(page).toHaveTitle(new RegExp(projectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 10000 });
    }
    await expect(page).toHaveTitle(/BDD Dashboard/i);
  });

  test('should restore default title when navigating back from project', async ({ page }) => {
    // Given: The user has navigated to a project detail page
    await page.goto('/');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
    await expect(page).toHaveTitle(/BDD Dashboard/i, { timeout: 10000 });

    // When: The user navigates back to the homepage
    await page.goBack();
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });

    // Then: The document title should revert to the default
    await expect(page).toHaveTitle(/Silverline.*Acceptance Test Dashboard/i, { timeout: 10000 });
  });
});
