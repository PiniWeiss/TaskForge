import { expect, test } from './fixtures.ts';

test('J/K move between rows, Enter opens, Esc closes and returns focus', async ({
  page,
  seeded,
}) => {
  await page.goto(`/p/${seeded.project.id}?sort=number`);
  await expect(page.getByRole('row')).toHaveCount(4);

  await page.keyboard.press('j');
  await expect(page.getByRole('link', { name: /Refund webhook/ })).toBeFocused();
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('k');
  await expect(page.getByRole('link', { name: /Export CSV/ })).toBeFocused();

  await page.keyboard.press('Enter');
  const panel = page.getByRole('complementary', { name: /Issue #/ });
  await expect(panel).toHaveAccessibleName('Issue #2');

  // With the panel open, J pages to the next issue in place.
  await page.keyboard.press('j');
  await expect(panel).toHaveAccessibleName('Issue #3');

  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/p/${seeded.project.id}\\?sort=number$`));
  await expect(page.getByRole('link', { name: /Tax ID field/ })).toBeFocused();
});

test('"/" focuses search and "?" lists the shortcuts', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}`);
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search issues' })).toBeFocused();

  // Shortcuts are ignored while typing.
  await page.keyboard.type('?c');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  await page.keyboard.press('?');
  const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Next issue');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});
