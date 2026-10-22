// AppError base class and NotFoundError / ConflictError / ValidationError subclasses.

import { ErrorCode, type MessageKey, type MessageParams } from '@taskforge/shared';
import type { z } from 'zod';

/** An expected failure. The central error handler turns it into `{ error: { code, message } }`. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly messageKey: MessageKey;
  readonly params: MessageParams;

  constructor(code: ErrorCode, status: number, messageKey: MessageKey, params: MessageParams = {}) {
    super(`${code}: ${messageKey}`);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.messageKey = messageKey;
    this.params = params;
  }
}

export class NotFoundError extends AppError {
  constructor(messageKey: MessageKey, params: MessageParams = {}) {
    super(ErrorCode.NOT_FOUND, 404, messageKey, params);
  }

  static project(id: string): NotFoundError {
    return new NotFoundError('error.notFound.project', { id });
  }

  static issue(id: string): NotFoundError {
    return new NotFoundError('error.notFound.issue', { id });
  }
}

export class ConflictError extends AppError {
  constructor(messageKey: MessageKey, params: MessageParams = {}) {
    super(ErrorCode.CONFLICT, 409, messageKey, params);
  }
}

/** Where a request value came from; prefixed to issue paths (`body.title`). */
export type RequestLocation = 'params' | 'query' | 'body';

export interface LocatedIssue {
  location: RequestLocation;
  issue: z.core.$ZodIssue;
}

export class ValidationError extends AppError {
  readonly issues: LocatedIssue[];

  constructor(issues: LocatedIssue[] = [], messageKey: MessageKey = 'error.validation') {
    super(ErrorCode.VALIDATION_ERROR, 400, messageKey);
    this.issues = issues;
  }
}
