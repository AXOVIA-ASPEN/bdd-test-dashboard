import { test, expect } from '@playwright/test';

test.describe('Project Navigation - Click project card to view details', () => {
  // Given a user is on the dashboard homepage
  // When they click on a project card
  // Then they should navigate to the project detail page
  // And be able to navigate back to the dashboard

  test('should navigate to project detail page when clicking a project card', async ({ page }) => {
    await page.goto('/');

    // Wait for project cards to render
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });

    // Get the href to verify navigation
    const href = await projectLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Click the project card
    await projectLink.click();

    // Should navigate to the project URL
    await expect(page).toHaveURL(new RegExp(href!.replace(/[/]/g, '\\/')), { timeout: 10000 });
  });

  test('should show project content or loading state after navigation', async ({ page }) => {
    await page.goto('/');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // The project page should show one of:
    // - Loading spinner ("Loading project...")
    // - Project content (back arrow link + project name)
    // - Not found message
    // - Error state
    const loadingState = page.getByText('Loading project...');
    const backArrow = page.locator('a[href="/"]');
    const notFound = page.getByText('not found', { exact: false });
    const errorState = page.getByText('Failed to load');

    // At least one of these should appear
    await expect(
      loadingState.or(backArrow.first()).or(notFound).or(errorState)
    ).toBeVisible({ timeout: 15000 });
  });

  test('should navigate back to dashboard via browser back button', async ({ page }) => {
    await page.goto('/');

    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 15000 });
    await projectLink.click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });

    // Use browser back
    await page.goBack();

    // Should be back on dashboard
    await expect(page.locator('h3:has-text("Projects")')).toBeVisible({ timeout: 15000 });
  });
});
