import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Issue } from '@taskforge/shared';
import { createTestContext, type TestContext } from '../helpers.ts';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

let ctx: TestContext;
let projectId: string;
let base: string;

beforeEach(async () => {
  ctx = createTestContext();
  projectId = (await ctx.seedProject('TaskForge')).id;
  base = `/projects/${projectId}/issues`;
});

async function createIssue(body: Record<string, unknown>, url = base): Promise<Issue> {
  const res = await request(ctx.app).post(url).send(body).expect(201);
  return res.body as Issue;
}

function errorBody(code: string, message: string): unknown {
  return { error: { code, message } };
}

describe('POST /projects/:projectId/issues', () => {
  it('creates an issue with defaults and returns 201', async () => {
    const res = await request(ctx.app)
      .post(base)
      .send({ title: 'Login fails', priority: 'high' })
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(201);

    expect(res.body).toEqual({
      id: expect.any(String) as unknown,
      projectId,
      title: 'Login fails',
      status: 'open',
      priority: 'high',
      createdAt: expect.any(String) as unknown,
      updatedAt: expect.any(String) as unknown,
    });
    const issue = res.body as Issue;
    expect(issue.updatedAt).toBe(issue.createdAt);
  });

  it('persists the issue so it can be fetched', async () => {
    const created = await createIssue({ title: 'Persist me', priority: 'low', description: 'd' });
    const res = await request(ctx.app).get(`${base}/${created.id}`).expect(200);
    expect(res.body).toEqual(created);
  });

  it('accepts an explicit status', async () => {
    const created = await createIssue({ title: 'WIP', priority: 'medium', status: 'in_progress' });
    expect(created.status).toBe('in_progress');
  });

  it('stores Hebrew text trimmed and NFC-normalized', async () => {
    const decomposed = 'שָׁלוֹם'.normalize('NFD');
    const created = await createIssue({
      title: `  ${decomposed} – login bug 🐛  `,
      description: 'תיאור בעברית',
      priority: 'low',
    });
    expect(created.title).toBe(`${'שָׁלוֹם'.normalize('NFC')} – login bug 🐛`);
    expect(created.description).toBe('תיאור בעברית');
  });

  it('counts the title limit in code points, not UTF-16 units', async () => {
    await createIssue({ title: '🐛'.repeat(200), priority: 'low' });
    const res = await request(ctx.app)
      .post(base)
      .send({ title: 'א'.repeat(201), priority: 'low' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body.title: must be at most 200 characters'),
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(ctx.app).post(base).send({}).expect(400);
    expect(res.body).toEqual(
      errorBody(
        'VALIDATION_ERROR',
        'Invalid request: body.title: is required; body.priority: is required',
      ),
    );
  });

  it('returns 400 for a blank title', async () => {
    const res = await request(ctx.app)
      .post(base)
      .send({ title: '   ', priority: 'low' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body.title: must not be empty'),
    );
  });

  it('returns 400 for an invalid priority or status', async () => {
    const res = await request(ctx.app)
      .post(base)
      .send({ title: 'x', priority: 'urgent', status: 'done' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody(
        'VALIDATION_ERROR',
        'Invalid request: body.status: must be one of: open, in_progress, closed; ' +
          'body.priority: must be one of: low, medium, high',
      ),
    );
  });

  it('returns 400 for a wrongly typed field', async () => {
    const res = await request(ctx.app).post(base).send({ title: 42, priority: 'low' }).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body.title: expected string'),
    );
  });

  it('rejects unknown fields such as projectId', async () => {
    const res = await request(ctx.app)
      .post(base)
      .send({ title: 'x', priority: 'low', projectId: MISSING_ID })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body: unknown field(s): projectId'),
    );
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(ctx.app)
      .post(base)
      .set('Content-Type', 'application/json')
      .send('{"title": ')
      .expect(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR', 'Malformed JSON body'));
  });

  it('returns 400 for a non-UUID projectId', async () => {
    const res = await request(ctx.app)
      .post('/projects/not-a-uuid/issues')
      .send({ title: 'x', priority: 'low' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: params.projectId: must be a valid uuid'),
    );
  });

  it('returns 404 for an unknown project', async () => {
    const res = await request(ctx.app)
      .post(`/projects/${MISSING_ID}/issues`)
      .send({ title: 'x', priority: 'low' })
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Project ${MISSING_ID} not found`));
  });

  it('localizes validation errors to Hebrew', async () => {
    const res = await request(ctx.app)
      .post(base)
      .set('Accept-Language', 'he-IL,he;q=0.9,en;q=0.8')
      .send({ priority: 'urgent' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody(
        'VALIDATION_ERROR',
        'בקשה לא תקינה: body.title: שדה חובה; body.priority: חייב להיות אחד מ: low, medium, high',
      ),
    );
  });
});

describe('GET /projects/:projectId/issues/:issueId', () => {
  it('returns the issue', async () => {
    const created = await createIssue({ title: 'Find me', priority: 'medium' });
    const res = await request(ctx.app).get(`${base}/${created.id}`).expect(200);
    expect(res.body).toEqual(created);
  });

  it('returns 404 for an unknown issue', async () => {
    const res = await request(ctx.app).get(`${base}/${MISSING_ID}`).expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Issue ${MISSING_ID} not found`));
  });

  it('returns 404 when the issue belongs to another project', async () => {
    const other = await ctx.seedProject('Other');
    const foreign = await createIssue(
      { title: 'Foreign', priority: 'low' },
      `/projects/${other.id}/issues`,
    );
    const res = await request(ctx.app).get(`${base}/${foreign.id}`).expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Issue ${foreign.id} not found`));
  });

  it('returns 404 for an unknown project', async () => {
    const created = await createIssue({ title: 'x', priority: 'low' });
    const res = await request(ctx.app)
      .get(`/projects/${MISSING_ID}/issues/${created.id}`)
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Project ${MISSING_ID} not found`));
  });

  it('returns 400 for a non-UUID issueId', async () => {
    const res = await request(ctx.app).get(`${base}/123`).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: params.issueId: must be a valid uuid'),
    );
  });

  it('localizes 404 messages to Hebrew', async () => {
    const res = await request(ctx.app)
      .get(`${base}/${MISSING_ID}`)
      .set('Accept-Language', 'he')
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `הסוגיה ${MISSING_ID} לא נמצאה`));
  });
});

describe('GET /projects/:projectId/issues', () => {
  async function seedIssues(): Promise<Issue[]> {
    return [
      await createIssue({ title: 'בדיקה', priority: 'low', status: 'open' }),
      await createIssue({ title: 'Alpha', priority: 'high', status: 'closed' }),
      await createIssue({ title: 'אבג', priority: 'medium', status: 'in_progress' }),
      await createIssue({ title: 'beta', priority: 'high', status: 'open' }),
    ];
  }

  function titles(body: unknown): string[] {
    return (body as { data: Issue[] }).data.map((i) => i.title);
  }

  it('returns an empty page for a project without issues', async () => {
    const res = await request(ctx.app).get(base).expect(200);
    expect(res.body).toEqual({ data: [], pagination: { total: 0, limit: 20, offset: 0 } });
  });

  it('lists only the issues of the project, newest first by default', async () => {
    const other = await ctx.seedProject('Other');
    await createIssue({ title: 'Elsewhere', priority: 'low' }, `/projects/${other.id}/issues`);
    await seedIssues();

    const res = await request(ctx.app).get(base).expect(200);
    expect(titles(res.body)).toEqual(['beta', 'אבג', 'Alpha', 'בדיקה']);
    expect((res.body as { pagination: unknown }).pagination).toEqual({
      total: 4,
      limit: 20,
      offset: 0,
    });
  });

  it('filters by status', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?status=open`).expect(200);
    expect(titles(res.body)).toEqual(['beta', 'בדיקה']);
  });

  it('matches status and priority filters case-insensitively', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?status=OPEN&priority=High`).expect(200);
    expect(titles(res.body)).toEqual(['beta']);
  });

  it('filters by priority', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?priority=high`).expect(200);
    expect(titles(res.body)).toEqual(['beta', 'Alpha']);
  });

  it('combines status and priority filters', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?status=open&priority=high`).expect(200);
    expect(titles(res.body)).toEqual(['beta']);
    expect((res.body as { pagination: { total: number } }).pagination.total).toBe(1);
  });

  it('sorts by priority rank, not alphabetically', async () => {
    await seedIssues();
    const asc = await request(ctx.app).get(`${base}?sort=priority`).expect(200);
    expect(titles(asc.body)).toEqual(['בדיקה', 'אבג', 'Alpha', 'beta']);
    const desc = await request(ctx.app).get(`${base}?sort=-priority`).expect(200);
    expect(titles(desc.body)).toEqual(['Alpha', 'beta', 'אבג', 'בדיקה']);
  });

  it('sorts by status in workflow order', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?sort=status`).expect(200);
    expect(titles(res.body)).toEqual(['בדיקה', 'beta', 'אבג', 'Alpha']);
  });

  it('sorts titles with Hebrew-aware collation', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?sort=title`).expect(200);
    expect(titles(res.body)).toEqual(['אבג', 'בדיקה', 'Alpha', 'beta']);
  });

  it('paginates with limit and offset', async () => {
    await seedIssues();
    const res = await request(ctx.app).get(`${base}?sort=createdAt&limit=2&offset=1`).expect(200);
    expect(titles(res.body)).toEqual(['Alpha', 'אבג']);
    expect((res.body as { pagination: unknown }).pagination).toEqual({
      total: 4,
      limit: 2,
      offset: 1,
    });
  });

  it('returns 400 for invalid query parameters', async () => {
    const res = await request(ctx.app)
      .get(`${base}?status=done&sort=assignee&limit=101&offset=-1`)
      .expect(400);
    expect(res.body).toEqual(
      errorBody(
        'VALIDATION_ERROR',
        'Invalid request: query.limit: must be at most 100; query.offset: must be at least 0; ' +
          'query.sort: must be one of: createdAt, -createdAt, priority, -priority, status, -status, title, -title; ' +
          'query.status: must be one of: open, in_progress, closed',
      ),
    );
  });

  it('returns 400 for a non-numeric limit', async () => {
    const res = await request(ctx.app).get(`${base}?limit=abc`).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: query.limit: expected number'),
    );
  });

  it('returns 404 for an unknown project', async () => {
    const res = await request(ctx.app).get(`/projects/${MISSING_ID}/issues`).expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Project ${MISSING_ID} not found`));
  });
});

describe('PATCH /projects/:projectId/issues/:issueId', () => {
  it('updates the status only and bumps updatedAt', async () => {
    const created = await createIssue({ title: 'Fix', priority: 'high', description: 'keep me' });
    const res = await request(ctx.app)
      .patch(`${base}/${created.id}`)
      .send({ status: 'closed' })
      .expect(200);

    const updated = res.body as Issue;
    expect(updated).toEqual({ ...created, status: 'closed', updatedAt: updated.updatedAt });
    expect(updated.updatedAt > created.updatedAt).toBe(true);

    const fetched = await request(ctx.app).get(`${base}/${created.id}`).expect(200);
    expect(fetched.body).toEqual(updated);
  });

  it('updates other fields partially', async () => {
    const created = await createIssue({ title: 'Old', priority: 'low' });
    const res = await request(ctx.app)
      .patch(`${base}/${created.id}`)
      .send({ title: ' חדש ', priority: 'high' })
      .expect(200);
    expect(res.body).toMatchObject({ title: 'חדש', priority: 'high', status: 'open' });
  });

  it('returns 400 for an empty body', async () => {
    const created = await createIssue({ title: 'x', priority: 'low' });
    const res = await request(ctx.app).patch(`${base}/${created.id}`).send({}).expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body: at least one field is required'),
    );
  });

  it('returns 400 for an invalid status', async () => {
    const created = await createIssue({ title: 'x', priority: 'low' });
    const res = await request(ctx.app)
      .patch(`${base}/${created.id}`)
      .send({ status: 'resolved' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody(
        'VALIDATION_ERROR',
        'Invalid request: body.status: must be one of: open, in_progress, closed',
      ),
    );
  });

  it('rejects attempts to move the issue to another project', async () => {
    const other = await ctx.seedProject('Other');
    const created = await createIssue({ title: 'x', priority: 'low' });
    const res = await request(ctx.app)
      .patch(`${base}/${created.id}`)
      .send({ projectId: other.id })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body: unknown field(s): projectId'),
    );
  });

  it('returns 404 for an unknown issue', async () => {
    const res = await request(ctx.app)
      .patch(`${base}/${MISSING_ID}`)
      .send({ status: 'closed' })
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Issue ${MISSING_ID} not found`));
  });

  it('returns 404 and leaves the issue untouched when it belongs to another project', async () => {
    const other = await ctx.seedProject('Other');
    const otherBase = `/projects/${other.id}/issues`;
    const foreign = await createIssue({ title: 'Foreign', priority: 'low' }, otherBase);

    await request(ctx.app).patch(`${base}/${foreign.id}`).send({ status: 'closed' }).expect(404);
    const res = await request(ctx.app).get(`${otherBase}/${foreign.id}`).expect(200);
    expect((res.body as Issue).status).toBe('open');
  });
});

describe('PUT /projects/:projectId/issues/:issueId', () => {
  it('replaces the issue, clearing omitted fields and re-applying defaults', async () => {
    const created = await createIssue({
      title: 'Old',
      priority: 'low',
      status: 'closed',
      description: 'to be cleared',
    });
    const res = await request(ctx.app)
      .put(`${base}/${created.id}`)
      .send({ title: 'New', priority: 'medium' })
      .expect(200);

    const replaced = res.body as Issue;
    expect(replaced).toEqual({
      id: created.id,
      projectId,
      title: 'New',
      priority: 'medium',
      status: 'open',
      createdAt: created.createdAt,
      updatedAt: replaced.updatedAt,
    });
    expect(replaced.updatedAt > created.updatedAt).toBe(true);
  });

  it('returns 400 when required fields are missing', async () => {
    const created = await createIssue({ title: 'x', priority: 'low' });
    const res = await request(ctx.app)
      .put(`${base}/${created.id}`)
      .send({ title: 'y' })
      .expect(400);
    expect(res.body).toEqual(
      errorBody('VALIDATION_ERROR', 'Invalid request: body.priority: is required'),
    );
  });

  it('returns 404 for an unknown issue', async () => {
    const res = await request(ctx.app)
      .put(`${base}/${MISSING_ID}`)
      .send({ title: 'y', priority: 'low' })
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Issue ${MISSING_ID} not found`));
  });
});

describe('DELETE /projects/:projectId/issues/:issueId', () => {
  it('deletes the issue and returns 204 with no body', async () => {
    const created = await createIssue({ title: 'Delete me', priority: 'low' });
    const res = await request(ctx.app).delete(`${base}/${created.id}`).expect(204);
    expect(res.text).toBe('');
    await request(ctx.app).get(`${base}/${created.id}`).expect(404);
  });

  it('returns 404 when deleting twice', async () => {
    const created = await createIssue({ title: 'Once', priority: 'low' });
    await request(ctx.app).delete(`${base}/${created.id}`).expect(204);
    const res = await request(ctx.app).delete(`${base}/${created.id}`).expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Issue ${created.id} not found`));
  });

  it('returns 404 and keeps the issue when it belongs to another project', async () => {
    const other = await ctx.seedProject('Other');
    const otherBase = `/projects/${other.id}/issues`;
    const foreign = await createIssue({ title: 'Foreign', priority: 'low' }, otherBase);

    await request(ctx.app).delete(`${base}/${foreign.id}`).expect(404);
    await request(ctx.app).get(`${otherBase}/${foreign.id}`).expect(200);
  });

  it('returns 404 for an unknown project', async () => {
    const res = await request(ctx.app)
      .delete(`/projects/${MISSING_ID}/issues/${MISSING_ID}`)
      .expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', `Project ${MISSING_ID} not found`));
  });
});

describe('fallback error handling', () => {
  it('returns 404 NOT_FOUND for unknown routes', async () => {
    const res = await request(ctx.app).get('/nope').expect(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND', 'Route GET /nope not found'));
  });

  it('returns 500 without leaking internals when a repository fails', async () => {
    ctx.issues.findById = () => Promise.reject(new Error('disk on fire at /secret/path'));
    const res = await request(ctx.app).get(`${base}/${MISSING_ID}`).expect(500);
    expect(res.body).toEqual(errorBody('INTERNAL_ERROR', 'Internal server error'));
  });
});
