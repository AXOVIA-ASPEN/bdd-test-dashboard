import { test, expect } from '@playwright/test';

test.describe('Run Tests Dialog - Trigger test runs from project detail', () => {
  // Given: A user is on a project detail page
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');
  });

  test('should show Run Tests button on project detail page', async ({ page }) => {
    // Given: The user is on a project detail page
    // Then: A "Run Tests" button should be visible
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
  });

  test('should open dialog when clicking Run Tests button', async ({ page }) => {
    // Given: The user is on a project detail page
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });

    // When: The user clicks "Run Tests"
    await runButton.click();

    // Then: The dialog should appear with a heading containing "Run Tests"
    const dialogHeading = page.locator('h3').filter({ hasText: /run tests/i });
    await expect(dialogHeading).toBeVisible({ timeout: 5000 });
  });

  test('should display Coming Soon notice in dialog', async ({ page }) => {
    // Given: The user opens the Run Tests dialog
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    // Then: A "Coming Soon" notice should be visible
    const notice = page.getByText('Coming Soon');
    await expect(notice).toBeVisible({ timeout: 5000 });
  });

  test('should display branch input defaulting to main', async ({ page }) => {
    // Given: The user opens the Run Tests dialog
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    // Then: A branch input should be visible with default value "main"
    const branchInput = page.locator('#run-branch');
    await expect(branchInput).toBeVisible({ timeout: 5000 });
    await expect(branchInput).toHaveValue('main');
  });

  test('should display command preview with make target', async ({ page }) => {
    // Given: The user opens the Run Tests dialog
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    // Then: A command preview should be visible containing "make"
    const codePreview = page.locator('code');
    await expect(codePreview).toBeVisible({ timeout: 5000 });
    await expect(codePreview).toContainText('make');
  });

  test('should close dialog when clicking Close button', async ({ page }) => {
    // Given: The Run Tests dialog is open
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    const dialogHeading = page.locator('h3').filter({ hasText: /run tests/i });
    await expect(dialogHeading).toBeVisible({ timeout: 5000 });

    // When: The user clicks the "Close" button
    const closeButton = page.getByRole('button', { name: /^close$/i });
    await closeButton.click();

    // Then: The dialog should disappear
    await expect(dialogHeading).not.toBeVisible({ timeout: 5000 });
  });

  test('should close dialog when clicking backdrop overlay', async ({ page }) => {
    // Given: The Run Tests dialog is open
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    const dialogHeading = page.locator('h3').filter({ hasText: /run tests/i });
    await expect(dialogHeading).toBeVisible({ timeout: 5000 });

    // When: The user clicks the backdrop overlay (top-left corner)
    await page.mouse.click(10, 10);

    // Then: The dialog should disappear
    await expect(dialogHeading).not.toBeVisible({ timeout: 5000 });
  });

  test('should update command preview when branch is changed', async ({ page }) => {
    // Given: The Run Tests dialog is open
    const runButton = page.getByRole('button', { name: /run tests/i });
    await expect(runButton).toBeVisible({ timeout: 10000 });
    await runButton.click();

    const branchInput = page.locator('#run-branch');
    await expect(branchInput).toBeVisible({ timeout: 5000 });

    // When: The user changes the branch to "develop"
    await branchInput.clear();
    await branchInput.fill('develop');

    // Then: The branch input should reflect the new value
    await expect(branchInput).toHaveValue('develop');

    // And: The command preview should still show the make command
    const codePreview = page.locator('code');
    await expect(codePreview).toContainText('make');
  });
});
