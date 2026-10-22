// Shared text field rules: trim, NFC-normalize, length limits counted in code points.

import { z } from 'zod';

export const TEXT_LIMITS = { name: 100, title: 200, description: 5000 } as const;

/** Counts code points, so an emoji or a Hebrew letter with nikud marks counts per code point, not per UTF-16 unit. */
export function codePointLength(value: string): number {
  return Array.from(value).length;
}

function maxCodePoints(max: number) {
  return (value: string, ctx: z.RefinementCtx) => {
    if (codePointLength(value) > max) {
      ctx.addIssue({
        code: 'too_big',
        origin: 'string',
        maximum: max,
        inclusive: true,
        input: value,
      });
    }
  };
}

/** Non-empty after trimming. */
export function requiredText(max: number) {
  return z.string().trim().normalize('NFC').min(1).superRefine(maxCodePoints(max));
}

/** May be empty after trimming. */
export function optionalText(max: number) {
  return z.string().trim().normalize('NFC').superRefine(maxCodePoints(max)).optional();
}
