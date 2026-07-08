import { expect, test } from '@playwright/test';
import { login, SEED } from './helpers';

test('navigates to the project board and shows seeded issues', async ({ page }) => {
  await login(page);

  // org list -> org -> project board
  await page.getByText(SEED.orgName).click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}$`));

  await page.getByText(SEED.projectKey, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/${SEED.projectKey}/board$`));

  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
  await expect(page.getByText('Backlog')).toBeVisible();

  // Seed loads demo issues; at least one card (rendered as "#<n> · <priority>").
  await expect(page.getByText(/#\d+\s+·/).first()).toBeVisible();
});
