// Fallback for unknown routes → NotFoundError.

import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/index.ts';

export const notFound: RequestHandler = (req) => {
  throw new NotFoundError('error.notFound.route', { method: req.method, path: req.path });
};
