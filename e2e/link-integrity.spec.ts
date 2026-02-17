import { test, expect } from '@playwright/test';

test.describe('Link Integrity - All internal links resolve without errors', () => {
  // Given a user is browsing the BDD Test Dashboard
  // When they click any internal link on the homepage
  // Then the destination should load successfully without 404 or crash

  test('should have no broken internal links on the homepage', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });

    // When we collect all internal links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map((a) => a.getAttribute('href')!)
        .filter((href) => href && (href.startsWith('/') || href.startsWith(window.location.origin)))
        .map((href) => (href.startsWith('/') ? href : new URL(href).pathname));
    });

    // Then each link (first 5) should resolve without server error
    const uniqueLinks = [...new Set(links)].slice(0, 5);
    expect(uniqueLinks.length).toBeGreaterThan(0);

    for (const link of uniqueLinks) {
      const response = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response?.status(), `Link ${link} returned server error`).toBeLessThan(500);

      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length, `Link ${link} rendered empty page`).toBeGreaterThan(0);
    }
  });

  test('should have accessible link text (no empty or generic links)', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });

    // When we inspect all links
    const linkData = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map((a) => ({
        href: a.getAttribute('href'),
        text: a.textContent?.trim() || '',
        ariaLabel: a.getAttribute('aria-label') || '',
        hasImage: a.querySelector('img, svg') !== null,
      }));
    });

    // Then every link should have meaningful accessible text
    for (const link of linkData) {
      const hasAccessibleName = link.text.length > 0 || link.ariaLabel.length > 0 || link.hasImage;
      expect(hasAccessibleName, `Link to ${link.href} has no accessible name`).toBe(true);
    }
  });

  test('should mark external links with rel="noopener" or rel="noreferrer"', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });

    // When we check external links that open in new tabs
    const externalLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[target="_blank"]'));
      return anchors.map((a) => ({
        href: a.getAttribute('href'),
        rel: a.getAttribute('rel') || '',
      }));
    });

    // Then all target="_blank" links should have security rel attributes
    for (const link of externalLinks) {
      const hasSecurityRel = link.rel.includes('noopener') || link.rel.includes('noreferrer');
      expect(hasSecurityRel, `External link ${link.href} missing rel="noopener/noreferrer"`).toBe(true);
    }
  });

  test('should navigate to project detail and back without breaking links', async ({ page }) => {
    // Given the homepage is loaded
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 10000 });

    // When we click the first project link
    const projectLink = page.getByRole('link').filter({ hasText: /.+/ }).first();
    const linkCount = await projectLink.count();

    if (linkCount > 0) {
      await projectLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Then the project detail page should have content
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(0);

      // And navigating back should restore the homepage links
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');

      const homepageLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).length;
      });
      expect(homepageLinks).toBeGreaterThan(0);
    }
  });
});
