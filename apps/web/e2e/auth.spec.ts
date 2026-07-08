import { expect, test } from '@playwright/test';
import { login, SEED } from './helpers';

test('signs in and lists the seeded organization', async ({ page }) => {
  await login(page);
  await expect(page.getByText(SEED.orgName)).toBeVisible();
});

test('rejects bad credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(SEED.email);
  await page.getByPlaceholder('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Stays on the login page and surfaces an error.
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
