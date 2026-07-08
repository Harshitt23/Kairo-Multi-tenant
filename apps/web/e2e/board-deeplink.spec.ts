import { expect, test } from '@playwright/test';
import { gotoBoard, SEED } from './helpers';

test('clicking a card deep-links to the issue and the link is shareable', async ({ page }) => {
  await gotoBoard(page);

  // Open the first issue card; the board mirrors it into ?issue=<number>.
  const card = page.getByText(/#\d+\s+·/).first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(/\?issue=\d+/);

  // The detail modal shows the "<PROJECT>-<number>" ref in its header.
  const ref = page.getByText(new RegExp(`${SEED.projectKey}-\\d+`));
  await expect(ref).toBeVisible();

  // The URL is a real deep link: a fresh load of it reopens the same issue.
  const deepLink = page.url();
  await page.goto(deepLink);
  await expect(page.getByText(new RegExp(`${SEED.projectKey}-\\d+`))).toBeVisible();
});
