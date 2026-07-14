import { expect, test } from '@playwright/test';
import { gotoOrg, SEED } from './helpers';

test('opens the inbox from the sidebar', async ({ page }) => {
  await gotoOrg(page);

  await page.getByRole('link', { name: 'Inbox' }).click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/inbox$`));
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();

  // The subtitle resolves once the page loads: "N unread" when there are
  // notifications, "You're all caught up." when there aren't. Either proves it
  // rendered rather than hanging on the skeleton.
  await expect(page.getByTestId('inbox-subtitle')).toBeVisible();
  await expect(page.getByTestId('inbox-subtitle')).toHaveText(/unread|caught up/i);
});
