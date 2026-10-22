// validate({ body, params, query }) middleware using zod schemas.

import type { Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import { ValidationError, type LocatedIssue, type RequestLocation } from '../errors/index.ts';

type Schemas = Partial<Record<RequestLocation, z.ZodType>>;

export type Validated<S extends Schemas> = {
  [K in keyof S]: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

const LOCATIONS: readonly RequestLocation[] = ['params', 'query', 'body'];

/**
 * Parses each given request part with its schema and calls `handler` with the typed results.
 * All failures are collected into one ValidationError for the central error handler.
 */
export function validate<S extends Schemas>(
  schemas: S,
  handler: (input: Validated<S>, req: Request, res: Response) => Promise<void> | void,
): RequestHandler {
  return async (req, res) => {
    const input: Partial<Record<RequestLocation, unknown>> = {};
    const issues: LocatedIssue[] = [];

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = schema.safeParse(req[location], { reportInput: true });
      if (result.success) input[location] = result.data;
      else issues.push(...result.error.issues.map((issue) => ({ location, issue })));
    }

    if (issues.length > 0) throw new ValidationError(issues);
    await handler(input as Validated<S>, req, res);
  };
}
