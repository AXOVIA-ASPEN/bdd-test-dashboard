import { test, expect } from '@playwright/test';

test.describe('Theme Visual Consistency - CSS properties change with theme', () => {
  // Given: The dashboard supports dark and light themes
  // When: A user toggles the theme
  // Then: Computed background and text colors should visibly change,
  //       ensuring CSS custom properties are properly wired

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should change background color when theme is toggled', async ({ page }) => {
    // Given: The page is loaded with the default theme
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // When: We capture the initial background color
    const initialBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // And: Toggle the theme
    await toggleBtn.click();
    await page.waitForTimeout(400); // allow transition

    // Then: The background color should be different
    const toggledBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(toggledBg).not.toBe(initialBg);
  });

  test('should change text color when theme is toggled', async ({ page }) => {
    // Given: The page has visible heading text
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // When: We capture the initial text color
    const initialColor = await heading.evaluate((el) =>
      getComputedStyle(el).color
    );

    // And: Toggle the theme
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Then: The heading text color should change
    const toggledColor = await heading.evaluate((el) =>
      getComputedStyle(el).color
    );
    expect(toggledColor).not.toBe(initialColor);
  });

  test('should maintain readable contrast in both themes', async ({ page }) => {
    // Given: A function to parse rgb values and compute relative luminance
    const getContrastData = async () => {
      return page.evaluate(() => {
        const parseCss = (color: string) => {
          const m = color.match(/\d+/g);
          return m ? m.map(Number) : [0, 0, 0];
        };
        const luminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const bg = parseCss(getComputedStyle(document.body).backgroundColor);
        const h1 = document.querySelector('h1');
        const fg = h1 ? parseCss(getComputedStyle(h1).color) : [0, 0, 0];

        const lBg = luminance(bg[0], bg[1], bg[2]);
        const lFg = luminance(fg[0], fg[1], fg[2]);
        const lighter = Math.max(lBg, lFg);
        const darker = Math.min(lBg, lFg);
        return (lighter + 0.05) / (darker + 0.05);
      });
    };

    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // When: We measure contrast in the initial theme
    const contrastInitial = await getContrastData();

    // Then: WCAG AA requires >= 4.5:1 for normal text, >= 3:1 for large text (h1)
    expect(contrastInitial).toBeGreaterThanOrEqual(3);

    // When: We toggle and measure contrast in the alternate theme
    await toggleBtn.click();
    await page.waitForTimeout(400);

    const contrastToggled = await getContrastData();

    // Then: The alternate theme should also meet contrast requirements
    expect(contrastToggled).toBeGreaterThanOrEqual(3);
  });

  test('should apply consistent theme to project cards', async ({ page }) => {
    // Given: Project cards are visible on the dashboard
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    const card = page.locator('a[href*="/project/"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // When: We capture card background in initial theme
    const initialCardBg = await card.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );

    // And: Toggle the theme
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Then: Card background should change with the theme
    const toggledCardBg = await card.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(toggledCardBg).not.toBe(initialCardBg);
  });

  test('should style the toggle button itself appropriately per theme', async ({ page }) => {
    // Given: The toggle button is visible
    const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });

    // When: We capture the button's color in initial theme
    const initialBtnColor = await toggleBtn.evaluate((el) =>
      getComputedStyle(el).color
    );

    // And: Toggle
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Then: The button's icon/text color should adapt
    const toggledBtnColor = await toggleBtn.evaluate((el) =>
      getComputedStyle(el).color
    );
    expect(toggledBtnColor).not.toBe(initialBtnColor);
  });
});
