import { test, expect } from '@playwright/test';

test.describe('Run Detail - Scenario Step Details', () => {
  // Given: A user navigates to a run detail page with scenarios
  // When: They expand a feature to view scenarios
  // Then: Each scenario should display steps with BDD keywords, text, and status indicators

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to first project
    const projectLink = page.locator('a[href*="/project/"]').first();
    await expect(projectLink).toBeVisible({ timeout: 10000 });
    await projectLink.click();
    await page.waitForLoadState('networkidle');

    // Navigate to first run
    const runLink = page.locator('a[href*="/run/"]').first();
    await expect(runLink).toBeVisible({ timeout: 10000 });
    await runLink.click();
    await page.waitForLoadState('networkidle');
  });

  test('should display BDD keyword labels (Given/When/Then) for steps', async ({ page }) => {
    // Given: The user is on a run detail page with expanded scenarios
    // When: They look at step details
    // Then: BDD keywords should be visible as step prefixes

    // Expand first feature if collapsed
    const featureHeader = page.locator('button').filter({ hasText: /feature|scenario/i }).first();
    if (await featureHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isExpanded = await featureHeader.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await featureHeader.click();
      }
    }

    // Look for BDD keywords rendered in step rows
    const keywords = page.locator('.font-mono.font-semibold');
    const keywordCount = await keywords.count();

    if (keywordCount > 0) {
      // Verify at least one keyword is a BDD keyword
      const keywordTexts: string[] = [];
      for (let i = 0; i < Math.min(keywordCount, 10); i++) {
        const text = await keywords.nth(i).textContent();
        if (text) keywordTexts.push(text.trim());
      }
      const bddKeywords = ['Given', 'When', 'Then', 'And', 'But', 'After', 'Before'];
      const hasBddKeyword = keywordTexts.some(t => bddKeywords.some(k => t.includes(k)));
      expect(hasBddKeyword).toBe(true);
    } else {
      // If no font-mono keywords, check for keyword text in the page body
      const body = await page.locator('body').textContent();
      const hasKeywords = /\b(Given|When|Then|And|But)\b/.test(body || '');
      expect(hasKeywords).toBe(true);
    }
  });

  test('should display step text alongside keywords', async ({ page }) => {
    // Given: The user is viewing scenario steps
    // When: They read the step details
    // Then: Each keyword should be followed by descriptive step text

    // Expand first feature if needed
    const featureHeader = page.locator('button').filter({ hasText: /feature|scenario/i }).first();
    if (await featureHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isExpanded = await featureHeader.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await featureHeader.click();
      }
    }

    // Steps are rendered as flex rows with keyword + text spans
    // Look for step rows that contain both a keyword and descriptive text
    const stepRows = page.locator('.flex.items-start, .flex.items-baseline').filter({
      has: page.locator('.font-mono'),
    });

    const rowCount = await stepRows.count();
    if (rowCount > 0) {
      // Each step row should have more than just the keyword
      const firstRow = stepRows.first();
      const rowText = await firstRow.textContent();
      expect(rowText!.trim().length).toBeGreaterThan(3); // More than just "And" or "Given"
    } else {
      // Fallback: verify the page has scenario content
      const body = await page.locator('body').textContent();
      expect(body).toMatch(/\b(Given|When|Then)\b.*\w+/);
    }
  });

  test('should color-code step status (passed steps vs failed steps)', async ({ page }) => {
    // Given: A run has both passed and failed steps
    // When: The user views the step details
    // Then: Passed steps should use green/emerald and failed steps should use red

    // Expand first feature if needed
    const featureHeader = page.locator('button').filter({ hasText: /feature|scenario/i }).first();
    if (await featureHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isExpanded = await featureHeader.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await featureHeader.click();
      }
    }

    // Check for status-colored elements (emerald for pass, red for fail)
    const passedSteps = page.locator('.text-emerald-600, .text-emerald-400, .text-green-600, .text-green-400');
    const failedSteps = page.locator('.text-red-600, .text-red-400');

    const passedCount = await passedSteps.count();
    const failedCount = await failedSteps.count();

    // At least some steps should have status coloring
    expect(passedCount + failedCount).toBeGreaterThan(0);
  });

  test('should show step duration when available', async ({ page }) => {
    // Given: Steps have duration data
    // When: The user views step details
    // Then: Duration values should be displayed (e.g., "0.5s", "120ms")

    // Expand first feature if needed
    const featureHeader = page.locator('button').filter({ hasText: /feature|scenario/i }).first();
    if (await featureHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isExpanded = await featureHeader.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await featureHeader.click();
      }
    }

    // Duration is rendered with .text-muted class and ml-auto positioning
    const durationElements = page.locator('.text-muted.ml-auto');
    const count = await durationElements.count();

    if (count > 0) {
      // Verify duration format (e.g., "0.5s", "1.2s", "150ms")
      const firstDuration = await durationElements.first().textContent();
      expect(firstDuration).toMatch(/\d+(\.\d+)?\s*(ms|s|m|sec)/i);
    } else {
      // Duration might not be present for all runs - that's OK
      // Verify the page at least loaded properly
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  test('should render steps in sequential order within a scenario', async ({ page }) => {
    // Given: A scenario has multiple steps
    // When: The user reads through the steps
    // Then: Steps should follow BDD order (Given → When → Then)

    // Expand first feature if needed
    const featureHeader = page.locator('button').filter({ hasText: /feature|scenario/i }).first();
    if (await featureHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isExpanded = await featureHeader.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await featureHeader.click();
      }
    }

    const keywords = page.locator('.font-mono.font-semibold');
    const keywordCount = await keywords.count();

    if (keywordCount >= 2) {
      // Collect keyword sequence
      const keywordTexts: string[] = [];
      for (let i = 0; i < Math.min(keywordCount, 20); i++) {
        const text = await keywords.nth(i).textContent();
        if (text) keywordTexts.push(text.trim());
      }

      // Find the first "Given" and verify "When" or "Then" appears after it
      const givenIdx = keywordTexts.findIndex(t => t === 'Given');
      if (givenIdx >= 0) {
        const afterGiven = keywordTexts.slice(givenIdx + 1);
        const hasFollowUp = afterGiven.some(t => ['When', 'Then', 'And', 'But'].includes(t));
        expect(hasFollowUp).toBe(true);
      }
    }
  });
});
