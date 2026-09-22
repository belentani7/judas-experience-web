import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and shows Three.js canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveTitle(/.+/);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('favicon'))).toEqual([]);
  });
});