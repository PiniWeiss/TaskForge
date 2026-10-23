import { createIssue, createProject, expect, test, uniqueName } from './fixtures.ts';

test('creates a project inline and opens it', async ({ page }) => {
  const name = uniqueName('Mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('textbox', { name: 'New project name' }).fill(name);
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
  await expect(
    page
      .getByRole('navigation', { name: 'Projects' })
      .getByRole('link', { name: new RegExp(name) }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText(`No issues in ${name} yet.`)).toBeVisible();
});

test('shows the API error inline when the name is taken', async ({ page, request }) => {
  const existing = await createProject(request);
  await page.goto('/');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByRole('textbox', { name: 'New project name' }).fill(existing.name.toUpperCase());
  await page.keyboard.press('Enter');

  await expect(page.getByRole('alert')).toHaveText(
    `A project named "${existing.name}" already exists`,
  );
});

test('renames a project from its menu', async ({ page, request }) => {
  const project = await createProject(request);
  const renamed = uniqueName('Renamed');
  await page.goto(`/p/${project.id}`);
  await page.getByRole('button', { name: `Actions for ${project.name}` }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await page.getByRole('textbox', { name: `Rename ${project.name}` }).fill(renamed);
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible();
});

test('deletes a project after a confirmation that names it and counts its issues', async ({
  page,
  request,
}) => {
  const project = await createProject(request);
  await createIssue(request, project.id, { title: 'One', priority: 'low' });
  await createIssue(request, project.id, { title: 'Two', priority: 'low' });
  await page.goto(`/p/${project.id}`);

  await page.getByRole('button', { name: `Actions for ${project.name}` }).click();
  await page.getByRole('menuitem', { name: 'Delete…' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(`Delete ${project.name}?`);
  await expect(dialog).toContainText('This also deletes 2 issues.');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

  await dialog.getByRole('button', { name: 'Delete project' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('link', { name: new RegExp(project.name) })).toHaveCount(0);
  await expect(page).not.toHaveURL(new RegExp(project.id));
});
