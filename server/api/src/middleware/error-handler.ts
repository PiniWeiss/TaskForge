// Central error handler: maps AppError / zod / malformed JSON / unknown errors to { error: { code, message } }.

import {
  ErrorCode,
  localizeZodIssue,
  translate,
  type ErrorResponse,
  type Locale,
} from '@taskforge/shared';
import type { ErrorRequestHandler } from 'express';
import { AppError, ValidationError } from '../errors/index.ts';
import { getLocale } from './locale.ts';

/** body-parser marks unparseable JSON bodies with this type. */
function isMalformedJson(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed'
  );
}

function describe(err: ValidationError, locale: Locale): string {
  const summary = translate(err.messageKey, locale, err.params);
  if (err.issues.length === 0) return summary;
  const details = err.issues.map(({ location, issue }) => {
    const path = [location, ...issue.path.map(String)].join('.');
    return `${path}: ${localizeZodIssue(issue, locale)}`;
  });
  return `${summary}: ${details.join('; ')}`;
}

function toAppError(err: unknown): AppError | null {
  if (err instanceof AppError) return err;
  if (isMalformedJson(err)) return new ValidationError([], 'error.malformedJson');
  return null;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const locale = getLocale(res);
  const appError = toAppError(err);

  let status: number;
  let body: ErrorResponse;
  if (appError) {
    const message =
      appError instanceof ValidationError
        ? describe(appError, locale)
        : translate(appError.messageKey, locale, appError.params);
    status = appError.status;
    body = { error: { code: appError.code, message } };
  } else {
    console.error(err);
    status = 500;
    body = {
      error: { code: ErrorCode.INTERNAL_ERROR, message: translate('error.internal', locale) },
    };
  }

  res.status(status).json(body);
};
