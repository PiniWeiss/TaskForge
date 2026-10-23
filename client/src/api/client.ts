// The only place the client talks HTTP. Every API failure surfaces as an ApiError whose message is
// the API's own localized message, so views can show it verbatim.

import type { ErrorCode, ErrorResponse } from '@taskforge/shared';

export const API_BASE = '/api';

export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Sends a request and resolves with the parsed body (undefined for 204). */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': 'en' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      'NETWORK_ERROR',
      0,
      'Can’t reach the TaskForge server. Check that it’s running, then retry.',
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = await readJson(response);

  if (!response.ok) {
    if (isErrorResponse(payload)) {
      throw new ApiError(payload.error.code, response.status, payload.error.message);
    }
    throw new ApiError(
      'INTERNAL_ERROR',
      response.status,
      `The server answered ${String(response.status)} without an explanation.`,
    );
  }
  return payload as T;
}

/** Builds `?a=1&b=2`, skipping undefined values. */
export function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}
