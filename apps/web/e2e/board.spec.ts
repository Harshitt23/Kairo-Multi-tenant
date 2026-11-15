import { expect, test } from '@playwright/test';
import { gotoOrg, SEED } from './helpers';

test('navigates to the project board and shows seeded issues', async ({ page }) => {
  await gotoOrg(page);

  await page.getByText(SEED.projectKey, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/${SEED.projectKey}/board$`));

  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
  // exact: true — seeded issue titles also contain the word "backlog", so a
  // substring match resolves to the column header AND those cards.
  await expect(page.getByText('Backlog', { exact: true })).toBeVisible();

  // Seed loads demo issues; at least one card (rendered as "#<n> · <priority>").
  await expect(page.getByText(/#\d+\s+·/).first()).toBeVisible();
});
