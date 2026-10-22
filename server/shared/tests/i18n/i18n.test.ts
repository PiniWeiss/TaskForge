import { describe, expect, it } from 'vitest';
import {
  createIssueSchema,
  localizeZodIssue,
  messagesEn,
  messagesHe,
  translate,
} from '@taskforge/shared';

describe('translate', () => {
  it('interpolates params in both locales', () => {
    expect(translate('error.notFound.issue', 'en', { id: '42' })).toBe('Issue 42 not found');
    expect(translate('error.notFound.issue', 'he', { id: '42' })).toBe('הסוגיה 42 לא נמצאה');
  });

  it('has the same keys in both catalogs', () => {
    expect(Object.keys(messagesHe).sort()).toEqual(Object.keys(messagesEn).sort());
  });
});

describe('localizeZodIssue', () => {
  function issuesOf(input: unknown): Parameters<typeof localizeZodIssue>[0][] {
    const result = createIssueSchema.safeParse(input, { reportInput: true });
    if (result.success) throw new Error('expected a validation failure');
    return result.error.issues;
  }

  it('describes missing, enum and length issues in English', () => {
    const [title, priority] = issuesOf({ priority: 'urgent' });
    expect(title && localizeZodIssue(title, 'en')).toBe('is required');
    expect(priority && localizeZodIssue(priority, 'en')).toBe('must be one of: low, medium, high');

    const [tooLong] = issuesOf({ title: 'x'.repeat(201), priority: 'low' });
    expect(tooLong && localizeZodIssue(tooLong, 'en')).toBe('must be at most 200 characters');
  });

  it('describes issues in Hebrew', () => {
    const [title, priority] = issuesOf({ priority: 'urgent' });
    expect(title && localizeZodIssue(title, 'he')).toBe('שדה חובה');
    expect(priority && localizeZodIssue(priority, 'he')).toBe(
      'חייב להיות אחד מ: low, medium, high',
    );
  });
});
