import { test, expect } from '@playwright/test';

// These specs need only the Vite dev server (no backend): they cover public pages and route guards.
test('landing page renders with primary calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('connections');
  await expect(page.getByRole('link', { name: /create free account/i })).toBeVisible();
});
test('protected routes redirect anonymous visitors to login', async ({ page }) => {
  await page.goto('/participant/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
test('login form validates input before submitting', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Enter a valid email')).toBeVisible();
});
test('registration offers no admin role', async ({ page }) => {
  await page.goto('/register');
  const options = await page.getByLabel('I am joining as').locator('option').allTextContents();
  expect(options.map((o) => o.toLowerCase())).not.toContain('admin');
});
