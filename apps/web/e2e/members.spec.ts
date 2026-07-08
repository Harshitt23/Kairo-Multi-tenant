import { expect, test } from '@playwright/test';
import { gotoOrg, SEED } from './helpers';

test('members settings shows the owner and gates the invite form', async ({ page }) => {
  await gotoOrg(page);

  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/settings$`));

  // Both settings panels render.
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Email notifications' })).toBeVisible();

  // The seeded account is the owner and is flagged as the current user.
  const ownerRow = page.locator('li', { hasText: SEED.email });
  await expect(ownerRow).toBeVisible();
  await expect(ownerRow.getByText('You', { exact: true })).toBeVisible();
  await expect(ownerRow.getByText('OWNER', { exact: true })).toBeVisible();

  // Invite is disabled until an email is entered — non-destructive check that
  // doesn't actually create an invite against the shared seed data.
  const invite = page.getByRole('button', { name: 'Invite' });
  await expect(invite).toBeDisabled();
  await page.getByPlaceholder('teammate@company.com').fill('new.teammate@example.com');
  await expect(invite).toBeEnabled();
});
