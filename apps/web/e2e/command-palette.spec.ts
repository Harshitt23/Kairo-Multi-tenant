import { expect, test } from '@playwright/test';
import { gotoOrg, SEED } from './helpers';

test('command palette navigates via keyboard shortcut', async ({ page }) => {
  await gotoOrg(page);

  // Ctrl/⌘+K summons the palette (the handler accepts either modifier).
  await page.keyboard.press('Control+k');
  const search = page.getByPlaceholder('Type a command or search…');
  await expect(search).toBeVisible();

  // Filter to the Inbox command and run it with Enter. Use an exact name so we
  // don't also match the "Search everything for …" action the palette now adds.
  await search.fill('Inbox');
  await expect(page.getByRole('button', { name: 'Inbox', exact: true })).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(new RegExp(`/${SEED.orgSlug}/inbox$`));
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
});

test('command palette opens from the sidebar search button', async ({ page }) => {
  await gotoOrg(page);

  // Scope to the sidebar landmark: the org home page also has its own
  // "Search" quick-action button, so an unscoped name match is ambiguous.
  await page.getByRole('complementary').getByRole('button', { name: /Search/ }).click();
  await expect(page.getByPlaceholder('Type a command or search…')).toBeVisible();

  // Escape dismisses it.
  await page.keyboard.press('Escape');
  await expect(page.getByPlaceholder('Type a command or search…')).not.toBeVisible();
});
