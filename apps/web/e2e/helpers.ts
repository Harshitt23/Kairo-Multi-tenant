import { expect, type Page } from '@playwright/test';

export const SEED = {
  email: 'harshit@rolls-royce.com',
  password: 'password123',
  orgName: 'Rolls-Royce',
  orgSlug: 'rolls-royce',
  projectKey: 'ENG',
};

/**
 * Log in through the UI. The access token lives in memory (not localStorage),
 * so we stay within one client session — no full reload after login. There's
 * no org-picker step: the home page redirects straight into the signed-in
 * user's first org (see app/page.tsx), so login lands directly on it.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(SEED.email);
  await page.getByPlaceholder('Password').fill(SEED.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}$`));
}

/** Log in and land on the seeded org's home page (AppShell mounted). */
export async function gotoOrg(page: Page): Promise<void> {
  await login(page);
}

/** Enter the org and open the seeded project board. */
export async function gotoBoard(page: Page): Promise<void> {
  await gotoOrg(page);
  await page.getByText(SEED.projectKey, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/${SEED.projectKey}/board$`));
  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
}
