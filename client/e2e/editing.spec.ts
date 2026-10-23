import { expect, test } from './fixtures.ts';

const PATCH_ISSUE = /\/api\/projects\/[^/]+\/issues\/[^/?]+$/;

test('status changes show in the table before the server answers', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}`);
  await page.getByRole('row', { name: /Refund webhook/ }).click();
  const panel = page.getByRole('complementary', { name: 'Issue #1' });

  // Hold the PATCH until we have checked the optimistic state.
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(PATCH_ISSUE, async (route) => {
    if (route.request().method() === 'PATCH') await held;
    await route.fallback();
  });

  await panel.getByRole('combobox', { name: 'Status: Open' }).click();
  await page.getByRole('option', { name: 'Closed' }).click();

  const row = page.getByRole('row', { name: /Refund webhook/ });
  await expect(row).toContainText('Closed');
  await expect(panel.getByRole('status').last()).toHaveText('Saving…');

  release();
  await expect(panel.getByRole('status').last()).toHaveText('Saved.');
  const saved = await page.request.get(
    `/api/projects/${seeded.project.id}/issues/${seeded.issues[0]?.id ?? ''}`,
  );
  expect(((await saved.json()) as { status: string }).status).toBe('closed');
});

test('a failed save rolls back and explains why', async ({ page, seeded }) => {
  await page.route(PATCH_ISSUE, (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
          }),
        })
      : route.fallback(),
  );
  await page.goto(`/p/${seeded.project.id}`);
  await page.getByRole('row', { name: /Refund webhook/ }).click();
  const panel = page.getByRole('complementary', { name: 'Issue #1' });

  await panel.getByRole('combobox', { name: 'Priority: High' }).click();
  await page.getByRole('option', { name: 'Low' }).click();

  await expect(panel.getByRole('alert')).toHaveText(
    'Couldn’t save: Internal server error. The previous value is back.',
  );
  await expect(panel.getByRole('combobox', { name: 'Priority: High' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Refund webhook/ })).toContainText('High');
  await expect(panel.getByRole('status').last()).toHaveText('Priority not saved.');
});

test('the title saves on Enter and Esc puts back the saved text', async ({ page, seeded }) => {
  await page.goto(`/p/${seeded.project.id}`);
  await page.getByRole('row', { name: /Export CSV/ }).click();
  const title = page.getByRole('textbox', { name: 'Title' });

  await title.fill('Export CSV drops the currency column for EUR accounts');
  await title.press('Enter');
  await expect(page.getByRole('row', { name: /for EUR accounts/ })).toBeVisible();

  await title.fill('Something else entirely');
  await title.press('Escape');
  await expect(title).toHaveValue('Export CSV drops the currency column for EUR accounts');
});
