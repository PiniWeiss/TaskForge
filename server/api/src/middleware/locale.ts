// Resolves request locale (he / en) from Accept-Language.

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@taskforge/shared';
import type { RequestHandler, Response } from 'express';

interface LocaleLocals {
  locale?: Locale;
}

/** `Accept-Language: he` / `he-IL` → `he`; anything else (or no header) → the default. */
export const resolveLocale: RequestHandler = (req, res, next) => {
  const header = req.get('Accept-Language');
  const match = header ? req.acceptsLanguages(...LOCALES) : false;
  (res.locals as LocaleLocals).locale = match === 'he' ? 'he' : DEFAULT_LOCALE;
  next();
};

export function getLocale(res: Response): Locale {
  return (res.locals as LocaleLocals).locale ?? DEFAULT_LOCALE;
}
