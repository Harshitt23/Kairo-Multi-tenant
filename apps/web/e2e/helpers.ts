import { expect, type Page } from '@playwright/test';

export const SEED = {
  email: 'owner@acme.test',
  password: 'password123',
  orgName: 'Acme Inc.',
  orgSlug: 'acme',
  projectKey: 'PM',
};

/**
 * Log in through the UI. The access token lives in memory (not localStorage),
 * so we stay within one client session — no full reload after login.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(SEED.email);
  await page.getByPlaceholder('Password').fill(SEED.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Your organizations' })).toBeVisible();
}

/** Log in and enter the seeded org, landing on its home page (AppShell mounted). */
export async function gotoOrg(page: Page): Promise<void> {
  await login(page);
  await page.getByText(SEED.orgName).click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}$`));
}

/** Enter the org and open the seeded project board. */
export async function gotoBoard(page: Page): Promise<void> {
  await gotoOrg(page);
  await page.getByText(SEED.projectKey, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/${SEED.projectKey}/board$`));
  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
}
