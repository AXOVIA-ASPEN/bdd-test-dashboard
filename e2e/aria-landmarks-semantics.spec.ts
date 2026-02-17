import { test, expect } from '@playwright/test';

/**
 * BDD: ARIA Landmarks & Semantic Structure
 *
 * Given a user navigates to the dashboard using assistive technology
 * When the page loads
 * Then proper ARIA landmarks should be present for navigation
 * And heading hierarchy should be logical (no skipped levels)
 * And all images should have alt text
 * And interactive elements should have accessible names
 */

const LOAD_TIMEOUT = 15000;

test.describe('ARIA Landmarks & Semantic Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to render (same pattern as other tests)
    await expect(page.locator('text=Acceptance Test Dashboard')).toBeVisible({ timeout: LOAD_TIMEOUT });
  });

  // Given the dashboard is loaded
  // Then there should be exactly one main landmark
  test('should have exactly one main landmark', async ({ page }) => {
    const mains = page.getByRole('main');
    await expect(mains).toHaveCount(1);
  });

  // Given the dashboard is loaded
  // Then there should be a banner (header) landmark
  test('should have a banner landmark', async ({ page }) => {
    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
  });

  // Given the dashboard is loaded
  // Then headings should follow a logical hierarchy (h1 before h2, no skipped levels)
  test('should have logical heading hierarchy with no skipped levels', async ({ page }) => {
    const headings = await page.evaluate(() => {
      const els = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(els).map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim() || '',
        visible: el.offsetParent !== null || el.offsetWidth > 0,
      }));
    });

    const visibleHeadings = headings.filter(h => h.visible);
    expect(visibleHeadings.length).toBeGreaterThanOrEqual(1);

    // First heading should be h1
    expect(visibleHeadings[0].level).toBe(1);

    // No skipped heading levels going deeper
    for (let i = 1; i < visibleHeadings.length; i++) {
      const jump = visibleHeadings[i].level - visibleHeadings[i - 1].level;
      expect(jump, `Heading level jumped from h${visibleHeadings[i-1].level} to h${visibleHeadings[i].level}`).toBeLessThanOrEqual(1);
    }
  });

  // Given the dashboard is loaded
  // Then all images should have alt attributes
  test('should have alt text on all images', async ({ page }) => {
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).map(img => ({
        src: img.src,
        hasAlt: img.hasAttribute('alt'),
      }));
    });

    for (const img of images) {
      expect(img.hasAlt, `Image ${img.src} missing alt attribute`).toBe(true);
    }
  });

  // Given the dashboard is loaded
  // Then all buttons should have accessible names
  test('should have accessible names on all buttons', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') ??
        await button.textContent();
      expect(name?.trim().length, `Button ${i} has no accessible name`).toBeGreaterThan(0);
    }
  });

  // Given the dashboard is loaded
  // Then all links should have accessible text
  test('should have accessible text on all links', async ({ page }) => {
    const links = page.getByRole('link');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const accessibleName = ariaLabel || text?.trim();
      expect(
        accessibleName?.length,
        `Link ${i} (href: ${await link.getAttribute('href')}) has no accessible name`
      ).toBeGreaterThan(0);
    }
  });

  // Given the user navigates to a project detail page
  // Then proper landmarks should also be present
  test('should maintain landmarks on project detail page', async ({ page }) => {
    // Wait for project cards
    const projectNames = page.locator('h4.font-semibold');
    await expect(projectNames.first()).toBeVisible({ timeout: LOAD_TIMEOUT });

    // Click the first project link
    const firstProject = page.locator('a').filter({ has: projectNames.first() });
    await firstProject.first().click();

    // Wait for detail page to load
    await page.waitForURL(/\/project\//, { timeout: LOAD_TIMEOUT });
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('banner')).toBeVisible();

    // At least one heading
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible({ timeout: LOAD_TIMEOUT });
  });
});
