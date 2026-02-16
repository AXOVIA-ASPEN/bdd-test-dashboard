import { test, expect } from '@playwright/test';

test.describe('Project Detail - Filter and Search Controls', () => {
  // Given: A user navigates to a project detail page
  // When: They interact with filter controls
  // Then: The run list should update accordingly

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to first available project
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');
  });

  test('should display the Filter button on project detail page', async ({ page }) => {
    // Given: The user is on a project detail page
    // Then: A Filter button should be visible
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
  });

  test('should toggle filter panel when clicking Filter button', async ({ page }) => {
    // Given: The filter panel is initially hidden
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });

    // When: The user clicks the Filter button
    await filterButton.click();

    // Then: The filter panel should expand (aria-expanded=true)
    await expect(filterButton).toHaveAttribute('aria-expanded', 'true');

    // And: Status filter options should be visible
    const allButton = page.getByRole('button', { name: /^all$/i });
    await expect(allButton).toBeVisible();

    // When: The user clicks Filter again
    await filterButton.click();

    // Then: The filter panel should collapse
    await expect(filterButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should show status filter options when filter panel is open', async ({ page }) => {
    // Given: The user opens the filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await filterButton.click();

    // Then: Status options should be visible (all, passed, failed, skipped)
    for (const status of ['all', 'passed', 'failed', 'skipped']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${status}$`, 'i') });
      await expect(btn.first()).toBeVisible();
    }
  });

  test('should show branch search input when filter panel is open', async ({ page }) => {
    // Given: The user opens the filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await filterButton.click();

    // Then: A branch search/filter input should be visible
    const branchInput = page.getByPlaceholder(/branch/i);
    await expect(branchInput).toBeVisible();
  });

  test('should highlight active status filter', async ({ page }) => {
    // Given: The user opens the filter panel
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await filterButton.click();

    // When: The user clicks "passed" status filter
    const passedBtn = page.locator('button').filter({ hasText: /^passed$/i }).first();
    await passedBtn.click();

    // Then: The passed button should have the active accent style
    await expect(passedBtn).toHaveClass(/bg-accent/);

    // And: The filter button should show an active indicator (badge)
    await expect(filterButton).toHaveClass(/bg-accent/);
  });

  test('should clear all filters when clicking Clear all', async ({ page }) => {
    // Given: The user has an active status filter
    const filterButton = page.getByRole('button', { name: /filter/i });
    await expect(filterButton).toBeVisible({ timeout: 10000 });
    await filterButton.click();

    const passedBtn = page.locator('button').filter({ hasText: /^passed$/i }).first();
    await passedBtn.click();

    // When: The user clicks "Clear all"
    const clearBtn = page.getByRole('button', { name: /clear all/i }).or(page.getByText(/clear all/i));
    await clearBtn.first().click();

    // Then: The "all" status should be active again
    const allBtn = page.locator('button').filter({ hasText: /^all$/i }).first();
    await expect(allBtn).toHaveClass(/bg-accent/);
  });
});
