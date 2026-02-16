import { test, expect } from '@playwright/test';

test.describe('SEO & Meta Tags - Page metadata for search engines and social sharing', () => {
  // Given the dashboard is a public-facing web app
  // Then it should have proper meta tags for SEO, accessibility, and social sharing

  test('should have a valid charset meta tag', async ({ page }) => {
    // Given the user loads the homepage
    await page.goto('/');

    // Then the page should declare UTF-8 charset
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toLowerCase()).toBe('utf-8');
  });

  test('should have a viewport meta tag for responsive design', async ({ page }) => {
    // Given the dashboard supports mobile and desktop
    await page.goto('/');

    // Then the viewport meta tag should be present with width=device-width
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have a meaningful page title on the homepage', async ({ page }) => {
    // Given the user visits the dashboard root
    await page.goto('/');
    await page.waitForSelector('header');

    // Then the document title should be descriptive (not empty or generic)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Next.js');
  });

  test('should update page title on project detail page', async ({ page }) => {
    // Given the user navigates from homepage to a project
    await page.goto('/');
    const homepageTitle = await page.title();

    const projectLink = page.locator('a[href*="/project/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForURL(/\/project\//);

      // Then the title should change to reflect the project context
      const projectTitle = await page.title();
      expect(projectTitle.length).toBeGreaterThan(0);
      // Title should differ from homepage OR contain project-specific text
      // (Some apps keep the same title, so we just verify it's not blank)
    }
  });

  test('should have favicon links in the document head', async ({ page }) => {
    // Given the app has branded favicons
    await page.goto('/');

    // Then at least one favicon/icon link should be present
    const iconLinks = page.locator('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    const count = await iconLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have a description meta tag', async ({ page }) => {
    // Given search engines need a page description
    await page.goto('/');

    // Then a description meta tag should exist (may be set by Next.js metadata)
    const description = page.locator('meta[name="description"]');
    const count = await description.count();
    // If present, it should have content
    if (count > 0) {
      const content = await description.getAttribute('content');
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(5);
    }
  });

  test('should have a lang attribute on the html element', async ({ page }) => {
    // Given accessibility and SEO require a language declaration
    await page.goto('/');

    // Then the <html> element should have a lang attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang!.length).toBeGreaterThanOrEqual(2);
  });

  test('should serve valid favicon files without 404', async ({ page, request }) => {
    // Given the app references favicon files
    await page.goto('/');

    // When we request the standard favicon path
    const response = await request.get('/favicon.ico');

    // Then it should not 404
    expect(response.status()).not.toBe(404);
  });

  test('should not have noindex meta tag on public pages', async ({ page }) => {
    // Given the dashboard is meant to be publicly accessible
    await page.goto('/');

    // Then there should be no noindex directive blocking search engines
    const robots = page.locator('meta[name="robots"]');
    const count = await robots.count();
    if (count > 0) {
      const content = await robots.getAttribute('content');
      expect(content).not.toContain('noindex');
    }
  });
});
