import { expect, test } from './fixtures.ts';

test('quick-add creates an issue with Medium priority from the keyboard', async ({
  page,
  seeded,
}) => {
  await page.goto(`/p/${seeded.project.id}`);
  await expect(page.getByRole('row')).toHaveCount(4);

  await page.keyboard.press('c');
  const title = page.getByRole('textbox', { name: 'Issue title' });
  await expect(title).toBeFocused();
  await title.fill('Payout schedule page times out');
  await page.keyboard.press('Enter');

  const row = page.getByRole('row', { name: /Payout schedule page times out/ });
  await expect(row).toContainText('#4');
  await expect(row).toContainText('Medium');
  await expect(row).toContainText('Open');
  await expect(page.getByText('Created #4.')).toBeVisible();
  // The field stays open and empty for the next issue.
  await expect(title).toHaveValue('');
  await expect(title).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('form', { name: 'New issue' })).toHaveCount(0);
});

test('requires a title before creating', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}`);
  await page.getByRole('button', { name: /New issue/ }).click();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Give the issue a title.');
});

test('filters come from the URL, update it, and survive a reload', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}?status=closed`);
  await expect(page.getByRole('radio', { name: 'Closed' })).toBeChecked();
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('row', { name: /Tax ID field/ })).toBeVisible();

  await page.getByRole('radio', { name: 'All' }).click();
  await expect(page.getByRole('radio', { name: 'All' })).toBeChecked();
  await page.getByRole('combobox', { name: /Priority/ }).click();
  await page.getByRole('option', { name: 'High' }).click();
  await expect(page).toHaveURL(/\?priority=high$/);
  await expect(page.getByRole('row')).toHaveCount(2);

  await page.getByRole('searchbox', { name: 'Search issues' }).fill('nothing like this');
  await expect(page).toHaveURL(/q=nothing/);
  await expect(page.getByText(/No issues match priority High and/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search issues' })).toHaveValue(
    'nothing like this',
  );
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${seeded.project.id}$`));
  await expect(page.getByRole('row')).toHaveCount(4);
});

test('sorting by a column header writes the sort to the URL', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}`);
  const priority = page.getByRole('columnheader', { name: 'Priority' });
  await priority.getByRole('button').click();
  await expect(page).toHaveURL(/sort=-priority/);
  await expect(priority).toHaveAttribute('aria-sort', 'descending');
  await expect(page.getByRole('row').nth(1)).toContainText('Refund webhook');
});
