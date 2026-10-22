// Localized zod error map.

import type { z } from 'zod';
import { translate, isMessageKey, type Locale } from './translate.ts';

/**
 * Describes one zod issue (without its path) in the given locale.
 * Parse with `{ reportInput: true }` so a missing value reads as "is required"
 * rather than as a type mismatch.
 */
export function localizeZodIssue(issue: z.core.$ZodIssue, locale: Locale): string {
  // zod reports a missing enum value as invalid_value, a missing string as invalid_type.
  if (
    (issue.code === 'invalid_type' || issue.code === 'invalid_value') &&
    issue.input === undefined
  ) {
    return translate('validation.required', locale);
  }
  switch (issue.code) {
    case 'invalid_type':
      return translate('validation.invalidType', locale, { expected: issue.expected });
    case 'too_small':
      if (issue.origin === 'string') {
        return Number(issue.minimum) === 1
          ? translate('validation.empty', locale)
          : translate('validation.tooShort', locale, { minimum: Number(issue.minimum) });
      }
      return translate('validation.tooSmall', locale, { minimum: Number(issue.minimum) });
    case 'too_big':
      return translate(
        issue.origin === 'string' ? 'validation.tooLong' : 'validation.tooBig',
        locale,
        {
          maximum: Number(issue.maximum),
        },
      );
    case 'invalid_value':
      return translate('validation.invalidValue', locale, {
        values: issue.values.map(String).join(', '),
      });
    case 'invalid_format':
      return translate('validation.invalidFormat', locale, { format: issue.format });
    case 'unrecognized_keys':
      return translate('validation.unrecognizedKeys', locale, { keys: issue.keys.join(', ') });
    case 'custom': {
      const key: unknown = issue.params?.key;
      return translate(isMessageKey(key) ? key : 'validation.invalid', locale);
    }
    default:
      return translate('validation.invalid', locale);
  }
}
