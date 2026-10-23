import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@taskforge/shared';
import { createTestContext, type TestContext } from '../helpers.ts';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestContext();
});

async function createProject(body: Record<string, unknown>): Promise<Project> {
  const res = await request(ctx.app).post('/projects').send(body).expect(201);
  return res.body as Project;
}

function errorBody(code: string, message: string): unknown {
  return { error: { code, message } };
}

describe('POST /projects', () => {
  it('creates a project and returns 201', async () => {
    const res = await request(ctx.app)
      .post('/projects')
      .send({ name: '  Payments ', description: 'Billing and invoices' })
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(201);
    expect(res.body).toEqual({
      id: expect.any(String) as unknown,
      name: 'Payments',
      description: 'Billing and invoices',
      createdAt: expect.any(String) as unknown,
      updatedAt: expect.any(String) as unknown,
    });
  });

  it('returns 409 for a duplicate name, ignoring case and normalization', async () => {
    const existing = await createProject({ name: 'שָׁלוֹם Web' });
    const res = await request(ctx.app)
      .post('/projects')
      .send({ name: 'שָׁלוֹם WEB'.normalize('NFD') })
      .expect(409);
    expect(res.body).toEqual(
      errorBody('CONFLICT', `A project named "${existing.name}" already exists`),
    );
  });

  it('localizes the conflict message to Hebrew', async () => {
    await createProject({ name: 'Infra' });
    const res = await request(ctx.app)
      .post('/projects')
      .set('Accept-Language', 'he')
      .send({ name: 'infra' })
      .expect(409);
    expect(res.body).toEqual(errorBody('CONFLICT', 'פרויקט בשם "Infra" כבר קיים'));
  });

  it('returns 400 for a missing name', async () => {
    const res = await request(ctx.app).post('/projects').send({}).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body.name: is required'),
    );
  });

  it('rejects unknown fields such as id', async () => {
    const res = await request(ctx.app).post('/projects').send({ name: 'x', id: 'y' }).expect(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /projects', () => {
  it('lists projects sorted by name with pagination', async () => {
    await createProject({ name: 'beta' });
    await createProject({ name: 'אלף' });
    await createProject({ name: 'Alpha' });

    const res = await request(ctx.app).get('/projects').expect(200);
    const body = res.body as { data: Project[]; pagination: unknown };
    expect(body.data.map((p) => p.name)).toEqual(['אלף', 'Alpha', 'beta']);
    expect(body.pagination).toEqual({ total: 3, limit: 20, offset: 0 });

    const page = await request(ctx.app).get('/projects?sort=-name&limit=1&offset=1').expect(200);
    expect((page.body as { data: Project[] }).data.map((p) => p.name)).toEqual(['Alpha']);
  });

  it('returns 400 for an unsupported sort field', async () => {
    const res = await request(ctx.app).get('/projects?sort=createdAt').expect(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /projects/:projectId', () => {
  it('returns the project', async () => {
    const created = await createProject({ name: 'Web' });
    const res = await request(ctx.app).get(`/projects/${created.id}`).expect(200);
    expect(res.body).toEqual(created);
  });

  it('returns 404 for an unknown project', async () => {
    const res = await request(ctx.app).get(`/projects/${MISSING_ID}`).expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Project ${MISSING_ID} not found`));
  });

  it('returns 400 for a non-UUID id', async () => {
    const res = await request(ctx.app).get('/projects/nope').expect(400);
    expect((res.body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /projects/:projectId', () => {
  it('renames the project and bumps updatedAt', async () => {
    const created = await createProject({ name: 'Web', description: 'keep' });
    const res = await request(ctx.app)
      .patch(`/projects/${created.id}`)
      .send({ name: 'Web app' })
      .expect(200);
    const updated = res.body as Project;
    expect(updated).toMatchObject({ id: created.id, name: 'Web app', description: 'keep' });
    expect(updated.updatedAt > created.updatedAt).toBe(true);
  });

  it('returns 409 when renaming onto another project', async () => {
    await createProject({ name: 'Web' });
    const other = await createProject({ name: 'Infra' });
    await request(ctx.app).patch(`/projects/${other.id}`).send({ name: 'WEB' }).expect(409);
  });

  it('returns 400 for an empty body', async () => {
    const created = await createProject({ name: 'Web' });
    const res = await request(ctx.app).patch(`/projects/${created.id}`).send({}).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body: at least one field is required'),
    );
  });

  it('returns 404 for an unknown project', async () => {
    await request(ctx.app).patch(`/projects/${MISSING_ID}`).send({ name: 'x' }).expect(404);
  });
});

describe('PUT /projects/:projectId', () => {
  it('replaces the project and clears an omitted description', async () => {
    const created = await createProject({ name: 'Web', description: 'drop' });
    const res = await request(ctx.app)
      .put(`/projects/${created.id}`)
      .send({ name: 'Web' })
      .expect(200);
    expect(res.body).not.toHaveProperty('description');
    expect((res.body as Project).createdAt).toBe(created.createdAt);
  });

  it('returns 400 when the name is missing', async () => {
    const created = await createProject({ name: 'Web' });
    await request(ctx.app).put(`/projects/${created.id}`).send({}).expect(400);
  });

  it('returns 404 for an unknown project', async () => {
    await request(ctx.app).put(`/projects/${MISSING_ID}`).send({ name: 'x' }).expect(404);
  });
});

describe('DELETE /projects/:projectId', () => {
  it('deletes the project with its issues and returns 204', async () => {
    const created = await createProject({ name: 'Web' });
    const issue = await request(ctx.app)
      .post(`/projects/${created.id}/issues`)
      .send({ title: 'Bug', priority: 'low' })
      .expect(201);

    const res = await request(ctx.app).delete(`/projects/${created.id}`).expect(204);
    expect(res.text).toBe('');
    await request(ctx.app).get(`/projects/${created.id}`).expect(404);
    expect(await ctx.issues.findById((issue.body as { id: string }).id)).toBeNull();
  });

  it('returns 404 when deleting twice', async () => {
    const created = await createProject({ name: 'Web' });
    await request(ctx.app).delete(`/projects/${created.id}`).expect(204);
    await request(ctx.app).delete(`/projects/${created.id}`).expect(404);
  });
});
